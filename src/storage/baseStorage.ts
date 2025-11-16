import { IStorage } from './types';
import { getDatabase } from './db';

/**
 * Generic IndexDB storage implementation
 * Can be used to store any type of data with string keys
 */
export class IndexDBStorage<T> implements IStorage<T> {
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(_dbName: string, storeName: string, _keyPath: string) {
    // dbName and keyPath are now managed by shared db initialization
    this.storeName = storeName;
  }

  /**
   * Initialize storage - gets shared database instance
   */
  async init(): Promise<void> {
    this.db = await getDatabase();
    console.log(`Storage ${this.storeName} ready`);
  }

  /**
   * Ensure database is initialized
   */
  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Get item by key
   */
  async get(key: string): Promise<T | null> {
    const db = this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get key "${key}": ${request.error}`));
      };
    });
  }

  /**
   * Set item
   */
  async set(key: string, value: T): Promise<void> {
    const db = this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set key "${key}": ${request.error}`));
      };
    });
  }

  /**
   * Remove item by key
   */
  async remove(key: string): Promise<void> {
    const db = this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to remove key "${key}": ${request.error}`));
      };
    });
  }

  /**
   * Clear all data from store
   */
  async clear(): Promise<void> {
    const db = this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear storage: ${request.error}`));
      };
    });
  }

  /**
   * Get all items from store
   */
  async getAll(): Promise<T[]> {
    const db = this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all items: ${request.error}`));
      };
    });
  }
}

