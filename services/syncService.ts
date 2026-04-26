export const SYNC_DB_NAME = 'FinDashSyncDB';
export const SYNC_STORE_NAME = 'handles';

export function openSyncDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(SYNC_DB_NAME, 1);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
                db.createObjectStore(SYNC_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveDirectoryHandle(handle: any) {
    const db = await openSyncDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SYNC_STORE_NAME);
        const request = store.put(handle, 'syncDirectory');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getDirectoryHandle(): Promise<any> {
    const db = await openSyncDB();
    return new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(SYNC_STORE_NAME, 'readonly');
        const store = transaction.objectStore(SYNC_STORE_NAME);
        const request = store.get('syncDirectory');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function verifyPermission(fileHandle: any, readWrite: boolean, silent: boolean = false) {
    const options: any = {};
    if (readWrite) {
        options.mode = 'readwrite';
    }
    if ((await fileHandle.queryPermission(options)) === 'granted') {
        return true;
    }
    if (silent) {
        return false;
    }
    if ((await fileHandle.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

export async function syncDataToDirectory(handle: any, filename: string, data: string, silent: boolean = false) {
    try {
        const hasPermission = await verifyPermission(handle, true, silent);
        if (!hasPermission) {
            if (!silent) console.error('Permission to directory denied.');
            return false;
        }

        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
        return true;
    } catch (error) {
        console.error('Error syncing data:', error);
        return false;
    }
}
