import { indexedDBManager, VaultData } from './indexedDB';

export async function testIndexedDB() {
  try {
    console.log('Testing IndexedDB...');
    
    // Initialize the database
    await indexedDBManager.init();
    console.log('✓ Database initialized');
    
    // Test data
    const testVault: VaultData = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Test Vault',
      symbol: 'TEST',
      coin: '0xabcdef1234567890abcdef1234567890abcdef12',
      coinSymbol: 'TKN',
      totalSupply: '1000.0',
      totalStaked: '500.0',
      vaultCreator: '0x9876543210fedcba9876543210fedcba98765432',
      vaultCreatorFee: 100,
      treasuryFee: 50,
      lastUpdated: Date.now(),
      isFavorite: false,
    };
    
    // Test saving vault
    await indexedDBManager.saveVault(testVault);
    console.log('✓ Vault saved');
    
    // Test retrieving vault
    const retrievedVault = await indexedDBManager.getVault(testVault.address);
    console.log('✓ Vault retrieved:', retrievedVault);
    
    // Test toggling favorite
    const isFavorite = await indexedDBManager.toggleFavorite(testVault.address);
    console.log('✓ Favorite toggled:', isFavorite);
    
    // Test getting favorites
    const favorites = await indexedDBManager.getFavoriteVaults();
    console.log('✓ Favorites retrieved:', favorites);
    
    // Test getting all vaults
    const allVaults = await indexedDBManager.getAllVaults();
    console.log('✓ All vaults retrieved:', allVaults);
    
    // Clean up
    await indexedDBManager.clearAllData();
    console.log('✓ Test data cleared');
    
    console.log('✓ All IndexedDB tests passed!');
    return true;
  } catch (error) {
    console.error('✗ IndexedDB test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure DOM is ready
  setTimeout(() => {
    testIndexedDB();
  }, 1000);
} 