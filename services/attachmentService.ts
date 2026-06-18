import { v4 as uuidv4 } from 'uuid';
import { BudgetAttachment, BudgetItem } from '../types';

export const ATTACHMENT_DB_NAME = 'FinDashAttachmentsDB';
export const ATTACHMENT_STORE_NAME = 'attachments';
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
];

export interface SerializedAttachment {
    id: string;
    budgetItemId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    dataBase64: string;
}

function openAttachmentDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(ATTACHMENT_DB_NAME, 1);
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(ATTACHMENT_STORE_NAME)) {
                db.createObjectStore(ATTACHMENT_STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'item';
}

function extFromMime(mimeType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/heic': 'jpg',
        'image/heif': 'jpg',
        'application/pdf': 'pdf',
    };
    return map[mimeType] || 'bin';
}

export function buildAttachmentName(budgetItem: Pick<BudgetItem, 'name' | 'date' | 'type'>, attachmentId: string, mimeType: string): string {
    const kind = budgetItem.type === 'income' ? 'invoice' : 'receipt';
    const shortId = attachmentId.replace(/-/g, '').slice(0, 6);
    return `findash-${kind}-${slugify(budgetItem.name)}-${budgetItem.date}-${shortId}.${extFromMime(mimeType)}`;
}

async function compressImage(file: File): Promise<{ blob: Blob; mimeType: string }> {
    if (file.type === 'application/pdf') {
        return { blob: file, mimeType: file.type };
    }

    try {
        const bitmap = await createImageBitmap(file);
        const maxEdge = 1600;
        const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not prepare image canvas');
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85);
        });

        if (blob) {
            return { blob, mimeType: 'image/jpeg' };
        }
    } catch {
        // Fall through to storing the original file.
    }

    return { blob: file, mimeType: file.type || 'image/png' };
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
}

export function validateAttachmentFile(file: File): string | null {
    const mime = file.type || 'application/octet-stream';
    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    if (!isImage && !isPdf) {
        return 'Only image files and PDFs are supported.';
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
        return 'File exceeds the 5 MB limit.';
    }
    return null;
}

export async function addAttachment(file: File, budgetItem: Pick<BudgetItem, 'id' | 'name' | 'date' | 'type'>): Promise<BudgetAttachment> {
    const validationError = validateAttachmentFile(file);
    if (validationError) throw new Error(validationError);

    const id = uuidv4();
    const { blob, mimeType } = await compressImage(file);
    if (blob.size > MAX_ATTACHMENT_BYTES) {
        throw new Error('Compressed file still exceeds the 5 MB limit.');
    }

    const attachment: BudgetAttachment = {
        id,
        budgetItemId: budgetItem.id,
        name: buildAttachmentName(budgetItem, id, mimeType),
        originalName: file.name,
        mimeType,
        size: blob.size,
        createdAt: new Date().toISOString(),
        blob,
    };

    const db = await openAttachmentDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
        tx.objectStore(ATTACHMENT_STORE_NAME).put(attachment);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    return attachment;
}

export async function getAttachment(id: string): Promise<BudgetAttachment | null> {
    const db = await openAttachmentDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ATTACHMENT_STORE_NAME, 'readonly');
        const request = tx.objectStore(ATTACHMENT_STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

export async function listAttachments(ids: string[]): Promise<BudgetAttachment[]> {
    const results = await Promise.all(ids.map(id => getAttachment(id)));
    return results.filter((a): a is BudgetAttachment => a !== null);
}

export async function deleteAttachment(id: string): Promise<void> {
    const db = await openAttachmentDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
        tx.objectStore(ATTACHMENT_STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteAttachmentsForBudgetItem(budgetItemId: string, attachmentIds: string[] = []): Promise<void> {
    if (attachmentIds.length > 0) {
        await Promise.all(attachmentIds.map(deleteAttachment));
        return;
    }
    const db = await openAttachmentDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
        const store = tx.objectStore(ATTACHMENT_STORE_NAME);
        const request = store.openCursor();
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                if (cursor.value.budgetItemId === budgetItemId) cursor.delete();
                cursor.continue();
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function serializeAllAttachments(): Promise<SerializedAttachment[]> {
    const db = await openAttachmentDB();
    const attachments: BudgetAttachment[] = await new Promise((resolve, reject) => {
        const tx = db.transaction(ATTACHMENT_STORE_NAME, 'readonly');
        const request = tx.objectStore(ATTACHMENT_STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });

    return Promise.all(
        attachments.map(async a => ({
            id: a.id,
            budgetItemId: a.budgetItemId,
            name: a.name,
            originalName: a.originalName,
            mimeType: a.mimeType,
            size: a.size,
            createdAt: a.createdAt,
            dataBase64: await blobToBase64(a.blob),
        }))
    );
}

export async function restoreAttachments(serialized: SerializedAttachment[]): Promise<void> {
    const db = await openAttachmentDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
        const store = tx.objectStore(ATTACHMENT_STORE_NAME);
        store.clear();
        serialized.forEach(item => {
            store.put({
                id: item.id,
                budgetItemId: item.budgetItemId,
                name: item.name,
                originalName: item.originalName,
                mimeType: item.mimeType,
                size: item.size,
                createdAt: item.createdAt,
                blob: base64ToBlob(item.dataBase64, item.mimeType),
            });
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export function createAttachmentPreviewUrl(attachment: BudgetAttachment): string {
    return URL.createObjectURL(attachment.blob);
}
