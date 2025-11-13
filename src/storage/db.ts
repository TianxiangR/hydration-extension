/**
 * Shared database initialization for all storage instances
 * This ensures all object stores are created in a single upgrade transaction
 */

const DB_NAME = 'hydration-extension';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

export const getDatabase = (): Promise<IDBDatabase> => {
  // Return existing database if already initialized
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  // Return existing initialization promise if in progress
  if (initPromise) {
    return initPromise;
  }

  // Create new initialization promise
  initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      initPromise = null;
      reject(new Error(`Failed to open IndexDB: ${request.error}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexDB initialized with all object stores');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('🔧 Upgrading IndexDB schema...');

      // Create errors_lists object store
      if (!db.objectStoreNames.contains('errors_lists')) {
        const errorsListStore = db.createObjectStore('errors_lists', { keyPath: 'origin' });
        errorsListStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('  ✓ Created object store: errors_lists');
      }

      // Create error_details object store
      if (!db.objectStoreNames.contains('error_details')) {
        const errorDetailsStore = db.createObjectStore('error_details', { keyPath: 'id' });
        errorDetailsStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('  ✓ Created object store: error_details');
      }
    };
  });

  return initPromise;
};

export const closeDatabase = () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
};

