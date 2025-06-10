import type { MediaData } from './initialEditorMediaState';

const DB_NAME = 'EditorMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'mediaStore';

export class IndexedDBAdapter {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('paragraphId', 'paragraphId', { unique: false });
        }
      };
    });
  }

  async saveImage(mediaData: MediaData): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(mediaData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save image'));
    });
  }

  async getImage(imageId: string): Promise<MediaData | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(imageId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get image'));
    });
  }

  async getImagesByParagraph(paragraphId: string): Promise<MediaData[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('paragraphId');
      const request = index.getAll(paragraphId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () =>
        reject(new Error('Failed to get images by paragraph'));
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete image'));
    });
  }

  async deleteImagesByParagraph(paragraphId: string): Promise<void> {
    const images = await this.getImagesByParagraph(paragraphId);

    for (const image of images) {
      await this.deleteImage(image.id);
    }
  }

  async getAllImages(): Promise<MediaData[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(new Error('Failed to get all images'));
    });
  }

  async cleanup(): Promise<void> {
    const allImages = await this.getAllImages();

    for (const image of allImages) {
      const daysSinceUpload =
        (Date.now() - image.metadata.uploadedAt.getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysSinceUpload > 30) {
        await this.deleteImage(image.id);
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
