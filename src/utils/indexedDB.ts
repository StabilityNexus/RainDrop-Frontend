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
  private dbVersion = 2;
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
          // Migrate to user-specific favorites if needed
          await this.migrateToUserFavorites();
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

        // User favorites store (user-specific favorite vault addresses)
        if (!db.objectStoreNames.contains('userFavorites')) {
          const userFavoritesStore = db.createObjectStore('userFavorites', { keyPath: ['userAddress', 'vaultAddress'] });
          userFavoritesStore.createIndex('userAddress', 'userAddress', { unique: false });
          userFavoritesStore.createIndex('vaultAddress', 'vaultAddress', { unique: false });
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

  async getFavoriteVaults(userAddress?: string): Promise<VaultData[]> {
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

  async getUserFavoriteVaults(userAddress: string): Promise<VaultData[]> {
    const db = await this.ensureDB();
    
    // Check if userFavorites store exists
    if (!db.objectStoreNames.contains('userFavorites')) {
      // Fallback to old method if userFavorites store doesn't exist
      return this.getFavoriteVaults();
    }
    
    const transaction = db.transaction(['vaults', 'userFavorites'], 'readonly');
    const vaultStore = transaction.objectStore('vaults');
    const userFavoritesStore = transaction.objectStore('userFavorites');
    const userFavoritesIndex = userFavoritesStore.index('userAddress');
    
    return new Promise((resolve, reject) => {
      // First get all user's favorite vault addresses
      const favoritesRequest = userFavoritesIndex.getAll(userAddress);
      favoritesRequest.onsuccess = () => {
        const userFavorites = favoritesRequest.result;
        const favoriteAddresses = new Set(userFavorites.map(fav => fav.vaultAddress.toLowerCase()));
        
        // Then get all vaults and filter for user's favorites
        const vaultsRequest = vaultStore.getAll();
        vaultsRequest.onsuccess = () => {
          const allVaults = vaultsRequest.result;
          const favoriteVaults = allVaults.filter(vault => 
            favoriteAddresses.has(vault.address.toLowerCase())
          );
          resolve(favoriteVaults);
        };
        vaultsRequest.onerror = () => reject(vaultsRequest.error);
      };
      favoritesRequest.onerror = () => reject(favoritesRequest.error);
    });
  }

  async toggleFavorite(vaultAddress: string, userAddress?: string): Promise<boolean> {
    if (!userAddress) {
      // Fallback to old method for backward compatibility
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
            resolve(false);
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    }

    // Check if userFavorites store exists
    const db = await this.ensureDB();
    if (!db.objectStoreNames.contains('userFavorites')) {
      // Fallback to old method if userFavorites store doesn't exist
      return this.toggleFavorite(vaultAddress);
    }

    // New user-specific method
    const transaction = db.transaction(['vaults', 'userFavorites'], 'readwrite');
    const vaultStore = transaction.objectStore('vaults');
    const userFavoritesStore = transaction.objectStore('userFavorites');
    
    return new Promise((resolve, reject) => {
      // Check if this vault is already favorited by this user
      const getRequest = userFavoritesStore.get([userAddress, vaultAddress]);
      getRequest.onsuccess = () => {
        const existingFavorite = getRequest.result;
        
        if (existingFavorite) {
          // Remove from favorites
          const deleteRequest = userFavoritesStore.delete([userAddress, vaultAddress]);
          deleteRequest.onsuccess = () => {
            // Update vault's isFavorite status
            const vaultGetRequest = vaultStore.get(vaultAddress);
            vaultGetRequest.onsuccess = () => {
              const vault = vaultGetRequest.result;
              if (vault) {
                vault.isFavorite = false;
                const vaultPutRequest = vaultStore.put(vault);
                vaultPutRequest.onsuccess = () => resolve(false);
                vaultPutRequest.onerror = () => reject(vaultPutRequest.error);
              } else {
                resolve(false);
              }
            };
            vaultGetRequest.onerror = () => reject(vaultGetRequest.error);
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          // Add to favorites
          const addRequest = userFavoritesStore.add({
            userAddress,
            vaultAddress,
            addedAt: Date.now()
          });
          addRequest.onsuccess = () => {
            // Update vault's isFavorite status
            const vaultGetRequest = vaultStore.get(vaultAddress);
            vaultGetRequest.onsuccess = () => {
              const vault = vaultGetRequest.result;
              if (vault) {
                vault.isFavorite = true;
                const vaultPutRequest = vaultStore.put(vault);
                vaultPutRequest.onsuccess = () => resolve(true);
                vaultPutRequest.onerror = () => reject(vaultPutRequest.error);
              } else {
                resolve(true);
              }
            };
            vaultGetRequest.onerror = () => reject(vaultGetRequest.error);
          };
          addRequest.onerror = () => reject(addRequest.error);
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

  async migrateToUserFavorites(): Promise<void> {
    const db = await this.ensureDB();
    
    // Check if userFavorites store exists
    if (!db.objectStoreNames.contains('userFavorites')) {
      console.log('userFavorites store does not exist, skipping migration');
      return;
    }

    try {
      // Get all vaults first
      const vaults = await this.getAllVaults();
      const favoriteVaults = vaults.filter(vault => vault.isFavorite === true);
      
      if (favoriteVaults.length === 0) {
        return;
      }

      // For now, we'll migrate existing favorites to a default user
      // In a real app, you might want to prompt the user to associate these with their wallet
      const defaultUserAddress = '0x0000000000000000000000000000000000000000';
      
      // Add each favorite to the userFavorites store
      for (const vault of favoriteVaults) {
        try {
          await this.addUserFavorite(defaultUserAddress, vault.address);
        } catch (err) {
          // If it already exists, that's fine
          if (err instanceof Error && err.name !== 'ConstraintError') {
            console.error('Error migrating favorite:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error during migration:', err);
    }
  }

  private async addUserFavorite(userAddress: string, vaultAddress: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['userFavorites'], 'readwrite');
    const store = transaction.objectStore('userFavorites');
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        userAddress,
        vaultAddress,
        addedAt: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['vaults', 'drops', 'userVaultData', 'userFavorites'], 'readwrite');
    
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
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('userFavorites').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ];
    
    await Promise.all(promises);
  }
}

export const indexedDBManager = new IndexedDBManager();
export type { VaultData, DropData, UserVaultData }; 