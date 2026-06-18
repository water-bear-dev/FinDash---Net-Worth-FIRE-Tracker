import { EncryptedBackupEnvelope } from '../types';

const PBKDF2_ITERATIONS = 100000;

function toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
}

function fromBase64(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptJSON(plaintext: string, passphrase: string): Promise<EncryptedBackupEnvelope> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));

    return {
        findashEncrypted: true,
        salt: toBase64(salt.buffer),
        iv: toBase64(iv.buffer),
        data: toBase64(ciphertext),
    };
}

export async function decryptJSON(envelope: EncryptedBackupEnvelope, passphrase: string): Promise<string> {
    const salt = new Uint8Array(fromBase64(envelope.salt));
    const iv = new Uint8Array(fromBase64(envelope.iv));
    const key = await deriveKey(passphrase, salt);
    const ciphertext = fromBase64(envelope.data);

    try {
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return new TextDecoder().decode(decrypted);
    } catch {
        throw new Error('Decryption failed. Check your passphrase.');
    }
}

export function isEncryptedBackup(data: unknown): data is EncryptedBackupEnvelope {
    return typeof data === 'object' && data !== null && (data as EncryptedBackupEnvelope).findashEncrypted === true;
}
