interface VaultData {
  address: string;
  name: string;
  symbol: string;
  coin: string;
  coinSymbol: string;
  totalSupply: string;
  totalStaked: string;
  vaultCreator: string;
  vaultCreatorFee: number;
  treasuryFee: number;
  lastUpdated: number;
  isFavorite?: boolean;
}

interface DropData {
  id: number;
  vaultAddress: string;
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;
  amountRemaining: string;
  balanceStaked: string;
  deadline: number;
  recoverer: string;
  lastUpdated: number;
}

interface UserVaultData {
  vaultAddress: string;
  userAddress: string;
  coinBalance: string;
  stakedBalance: string;
  stakerCounterstamp: number;
  lastUpdated: number;
}

class IndexedDBManager {
  private dbName = 'RainDropDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        this.db = request.result;
        try {
          // Migrate existing vault data to ensure isFavorite is properly set
          await this.migrateVaultData();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Vaults store
        if (!db.objectStoreNames.contains('vaults')) {
          const vaultStore = db.createObjectStore('vaults', { keyPath: 'address' });
          vaultStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          vaultStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Drops store
        if (!db.objectStoreNames.contains('drops')) {
          const dropStore = db.createObjectStore('drops', { keyPath: ['vaultAddress', 'id'] });
          dropStore.createIndex('vaultAddress', 'vaultAddress', { unique: false });
          dropStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // User vault data store
        if (!db.objectStoreNames.contains('userVaultData')) {
          const userStore = db.createObjectStore('userVaultData', { keyPath: ['vaultAddress', 'userAddress'] });
          userStore.createIndex('userAddress', 'userAddress', { unique: false });
          userStore.createIndex('vaultAddress', 'vaultAddress', { unique: false });
          userStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Favorites store (simple key-value for favorite vault addresses)
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'vaultAddress' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Vault operations
  async saveVault(vault: VaultData): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readwrite');
    const store = transaction.objectStore('vaults');
    vault.lastUpdated = Date.now();
    // Ensure isFavorite is always a boolean
    if (vault.isFavorite === undefined) {
      vault.isFavorite = false;
    }
    await new Promise((resolve, reject) => {
      const request = store.put(vault);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveVaults(vaults: VaultData[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readwrite');
    const store = transaction.objectStore('vaults');
    
    return new Promise((resolve, reject) => {
      const promises = vaults.map(vault => {
        vault.lastUpdated = Date.now();
        // Ensure isFavorite is always a boolean
        if (vault.isFavorite === undefined) {
          vault.isFavorite = false;
        }
        
        return new Promise<void>((resolveVault, rejectVault) => {
          const request = store.put(vault);
          request.onsuccess = () => resolveVault();
          request.onerror = () => rejectVault(request.error);
        });
      });
      
      Promise.all(promises).then(() => resolve()).catch(reject);
    });
  }

  async getVault(address: string): Promise<VaultData | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readonly');
    const store = transaction.objectStore('vaults');
    return new Promise((resolve, reject) => {
      const request = store.get(address);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllVaults(): Promise<VaultData[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readonly');
    const store = transaction.objectStore('vaults');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFavoriteVaults(): Promise<VaultData[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readonly');
    const store = transaction.objectStore('vaults');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allVaults = request.result;
        // Filter for vaults that are explicitly marked as favorite
        const favoriteVaults = allVaults.filter(vault => vault.isFavorite === true);
        resolve(favoriteVaults);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async toggleFavorite(vaultAddress: string): Promise<boolean> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readwrite');
    const store = transaction.objectStore('vaults');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(vaultAddress);
      getRequest.onsuccess = () => {
        const vault = getRequest.result;
        if (vault) {
          vault.isFavorite = !vault.isFavorite;
          const putRequest = store.put(vault);
          putRequest.onsuccess = () => resolve(vault.isFavorite);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // If vault doesn't exist, we can't favorite it
          resolve(false);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Drop operations
  async saveDrops(vaultAddress: string, drops: DropData[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drops'], 'readwrite');
    const store = transaction.objectStore('drops');
    
    // Clear existing drops for this vault
    const index = store.index('vaultAddress');
    const clearRequest = index.openCursor(IDBKeyRange.only(vaultAddress));
    
    return new Promise((resolve, reject) => {
      clearRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Add new drops
          const promises = drops.map(drop => {
            drop.lastUpdated = Date.now();
            return new Promise<void>((resolveAdd, rejectAdd) => {
              const addRequest = store.add(drop);
              addRequest.onsuccess = () => resolveAdd();
              addRequest.onerror = () => rejectAdd(addRequest.error);
            });
          });
          
          Promise.all(promises).then(() => resolve()).catch(reject);
        }
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async getDrops(vaultAddress: string): Promise<DropData[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drops'], 'readonly');
    const store = transaction.objectStore('drops');
    const index = store.index('vaultAddress');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(vaultAddress);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // User vault data operations
  async saveUserVaultData(data: UserVaultData): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['userVaultData'], 'readwrite');
    const store = transaction.objectStore('userVaultData');
    data.lastUpdated = Date.now();
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserVaultData(vaultAddress: string, userAddress: string): Promise<UserVaultData | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['userVaultData'], 'readonly');
    const store = transaction.objectStore('userVaultData');
    
    return new Promise((resolve, reject) => {
      const request = store.get([vaultAddress, userAddress]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserVaults(userAddress: string): Promise<UserVaultData[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['userVaultData'], 'readonly');
    const store = transaction.objectStore('userVaultData');
    const index = store.index('userAddress');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userAddress);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserCreatedVaults(userAddress: string): Promise<VaultData[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readonly');
    const store = transaction.objectStore('vaults');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allVaults = request.result;
        // Filter for vaults created by this user
        const userCreatedVaults = allVaults.filter(vault => 
          vault.vaultCreator.toLowerCase() === userAddress.toLowerCase()
        );
        resolve(userCreatedVaults);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async isDataStale(lastUpdated: number, maxAgeMs: number = 5 * 60 * 1000): Promise<boolean> {
    return Date.now() - lastUpdated > maxAgeMs;
  }

  async syncUserFavoritesFromContract(userAddress: string, favoriteVaultAddresses: string[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readwrite');
    const store = transaction.objectStore('vaults');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allVaults = request.result;
        const favoriteSet = new Set(favoriteVaultAddresses.map(addr => addr.toLowerCase()));
        
        const updatePromises = allVaults.map(vault => {
          const isFavorite = favoriteSet.has(vault.address.toLowerCase());
          
          // Only update if the favorite status has changed
          if (vault.isFavorite !== isFavorite) {
            vault.isFavorite = isFavorite;
            
            return new Promise<void>((resolveUpdate, rejectUpdate) => {
              const updateRequest = store.put(vault);
              updateRequest.onsuccess = () => resolveUpdate();
              updateRequest.onerror = () => rejectUpdate(updateRequest.error);
            });
          }
          
          return Promise.resolve();
        });
        
        Promise.all(updatePromises).then(() => resolve()).catch(reject);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async migrateVaultData(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults'], 'readwrite');
    const store = transaction.objectStore('vaults');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const vaults = request.result;
        const updatePromises = vaults.map(vault => {
          // Ensure isFavorite is always a boolean
          if (vault.isFavorite === undefined) {
            vault.isFavorite = false;
          }
          
          return new Promise<void>((resolveUpdate, rejectUpdate) => {
            const updateRequest = store.put(vault);
            updateRequest.onsuccess = () => resolveUpdate();
            updateRequest.onerror = () => rejectUpdate(updateRequest.error);
          });
        });
        
        Promise.all(updatePromises).then(() => resolve()).catch(reject);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults', 'drops', 'userVaultData'], 'readwrite');
    
    const promises = [
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('vaults').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('drops').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('userVaultData').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ];
    
    await Promise.all(promises);
  }
}

export const indexedDBManager = new IndexedDBManager();
export type { VaultData, DropData, UserVaultData }; 