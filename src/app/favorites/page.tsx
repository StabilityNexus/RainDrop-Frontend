'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { formatUnits } from 'viem';
import { RefreshCw, Heart, ArrowLeft, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

import { config } from '@/utils/config';
import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';
import { ERC20Abi } from '@/utils/contractABI/ERC20';
import { Button } from '@/components/ui/button';
import { indexedDBManager, VaultData } from '@/utils/indexedDB';
import { VaultCard } from '@/components/VaultCard';

export default function FavoritesPage() {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();

  const [favorites, setFavorites] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadFavorites();
  }, [userAddress, isConnected]);

  const loadFavorites = async () => {
    if (!isConnected || !userAddress) {
      // If user is not connected, show empty favorites
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await indexedDBManager.init();

      // First, try to load from IndexedDB
      let cachedFavorites: VaultData[] = [];
      try {
        cachedFavorites = await indexedDBManager.getUserFavoriteVaults(userAddress);
      } catch (err) {
        console.log('User favorites store not ready yet, will sync from blockchain');
        // If userFavorites store doesn't exist yet, we'll sync from blockchain
      }

      if (cachedFavorites.length > 0) {
        setFavorites(cachedFavorites);
        setLoading(false);

        // Check if data is stale (older than 5 minutes)
        const hasStaleData = cachedFavorites.some(vault =>
          Date.now() - vault.lastUpdated > 5 * 60 * 1000
        );

        if (!hasStaleData) {
          return; // Data is fresh, no need to sync
        }
      }

      // If no cached data or data is stale, fetch from blockchain
      await syncFavorites();
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorite vaults');
    } finally {
      setLoading(false);
    }
  };

  const syncFavorites = async () => {
    if (!isConnected || !userAddress) return;

    try {
      setSyncing(true);
      setError(null);

      const client = getPublicClient(config);
      const factoryAddress = RaindropFractoryAddress[534351] as `0x${string}`;

      // Get user's vault history from contract
      const userVaultHistory = await client.readContract({
        address: factoryAddress,
        abi: RAINDROP_FACTORY_ABI,
        functionName: 'getUserVaultHistorySlice',
        args: [userAddress, BigInt(0), BigInt(999)], // Get up to 1000 vaults
      }) as `0x${string}`[];

      if (userVaultHistory.length === 0) {
        setFavorites([]);
        return;
      }

      // Get detailed vault information for each favorited vault
      const favoriteVaults = await Promise.all(
        userVaultHistory.map(async (vaultAddress) => {
          try {
            // Fetch fresh data from blockchain
            const [name, symbol, vaultCreator, vaultCreatorFee, treasuryFee, coin] = await Promise.all([
              client.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'name',
              }),
              client.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'symbol',
              }),
              client.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'vaultCreator',
              }),
              client.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'vaultCreatorFee',
              }),
              client.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'treasuryFee',
              }),
              client.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'coin',
              }),
            ]);

            const [totalSupply, totalStaked, coinSymbol] = await Promise.all([
              client.readContract({
                address: vaultAddress,
                abi: ERC20Abi,
                functionName: 'totalSupply',
              }),
              client.readContract({
                address: coin as `0x${string}`,
                abi: ERC20Abi,
                functionName: 'balanceOf',
                args: [vaultAddress],
              }),
              client.readContract({
                address: coin as `0x${string}`,
                abi: ERC20Abi,
                functionName: 'symbol',
              }),
            ]);

            const vaultData: VaultData = {
              address: vaultAddress,
              name: name as string,
              symbol: symbol as string,
              coin: coin as `0x${string}`,
              coinSymbol: coinSymbol as string,
              totalSupply: formatUnits(totalSupply as bigint, 18),
              totalStaked: formatUnits(totalStaked as bigint, 18),
              vaultCreator: vaultCreator as string,
              vaultCreatorFee: Number(vaultCreatorFee),
              treasuryFee: Number(treasuryFee),
              lastUpdated: Date.now(),
              isFavorite: true,
            };

            // Save to IndexedDB
            await indexedDBManager.saveVault(vaultData);
            return vaultData;
          } catch (err) {
            console.error(`Error loading vault ${vaultAddress}:`, err);
            return null;
          }
        })
      );

      const validVaults = favoriteVaults.filter((vault): vault is VaultData => vault !== null);
      setFavorites(validVaults);
    } catch (err) {
      console.error('Error syncing favorites:', err);
      setError('Failed to sync favorite vaults from blockchain');
    } finally {
      setSyncing(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(favorites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFavorites = favorites.slice(startIndex, endIndex);

  // Reset to page 1 when favorites change
  useEffect(() => {
    setCurrentPage(1);
  }, [favorites.length]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)' }} />

        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-indigo-500/30 rounded-2xl"></div>
            <div className="relative bg-[#232c3b] rounded-2xl px-12 py-12 border-2 border-purple-500/50">
              <div className="mb-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center border-2 border-purple-400">
                    <Heart className="text-white" size={32} />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white font-futuristic mb-4">Connect Wallet Required</h3>
              <p className="text-gray-300 font-futuristic mb-6">Connect your wallet to view your favorite vaults</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)' }} />

        <div className="relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-300 font-futuristic font-bold text-lg">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4 bg-[#0D0F14]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#131822] via-[#0D0F14] to-[#0B0D12] opacity-90" />

      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-pink-500/20 blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl animate-pulse animation-delay-4000" />
      </div>

      {/* Raindrop Animation */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {[...Array(4)].map((_, i) => {
          const leftPercent = Math.random() * 49;
          const delay = `${Math.random() * 3}s`;
          const duration = `${3 + Math.random() * 2}s`;
          return (
            <div
              key={`green-${i}`}
              className="absolute top-0 animate-rain"
              style={{ left: `${leftPercent}%`, animationDelay: delay, animationDuration: duration }}
            >
              <div className="w-[2px] h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full shadow-lg opacity-90" />
            </div>
          );
        })}
        {[...Array(4)].map((_, i) => {
          const leftPercent = 50 + Math.random() * 49;
          const delay = `${Math.random() * 3}s`;
          const duration = `${3 + Math.random() * 2}s`;
          return (
            <div
              key={`blue-${i}`}
              className="absolute top-0 animate-rain"
              style={{ left: `${leftPercent}%`, animationDelay: delay, animationDuration: duration }}
            >
              <div className="w-[2px] h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full shadow-lg opacity-90" />
            </div>
          );
        })}
      </div>

      <div className="w-full mt-20 sm:mt-24 mb-12 z-10 space-y-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        {/* Header */}
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            onClick={() => router.back()}
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 px-4 py-2 hover:bg-white/15 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <ArrowLeft size={20} className="text-white" />
            <span className="text-white font-futuristic">Back</span>
          </Button>

          <div className="text-center flex-1">
            <h1 className="font-futuristic text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 font-bold tracking-wider mb-2">
              Favorite Vaults
            </h1>
            <div className="relative mx-auto w-32 h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300 to-transparent rounded-full blur-sm opacity-50"></div>
            </div>
          </div>

          <Button
            onClick={syncFavorites}
            disabled={syncing}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed self-end sm:self-auto"
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex justify-center">
            <div className="relative group max-w-3xl w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/40 to-red-400/40 rounded-2xl"></div>
              <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden border-2 border-red-500">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 animate-gradient-x"></div>
                <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-8 py-4">
                  <p className="text-red-400 text-center font-futuristic font-bold">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-indigo-500/30 rounded-2xl"></div>
              <div className="relative bg-[#232c3b] rounded-2xl px-12 py-12 border-2 border-purple-500/50">
                <div className="mb-6">
                  <div className="relative inline-block">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center border-2 border-purple-400">
                      <Heart className="text-white" size={32} />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white font-futuristic mb-4">No Favorite Vaults</h3>
                <p className="text-gray-300 font-futuristic mb-6">Star vaults to add them to your favorites!</p>
                <Button
                  onClick={() => router.push('/explorer')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10"
                >
                  <PlusCircle className="h-5 w-5" />
                  Explore Vaults
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
              {currentFavorites.map((vault) => (
                <VaultCard
                  key={vault.address}
                  vault={vault}
                  onFavoriteToggle={(vaultAddress, isFavorite) => {
                    if (!isFavorite) {
                      // If unfavorited, remove from favorites list
                      setFavorites(prev => prev.filter(v => v.address !== vaultAddress));
                    }
                  }}
                  showLastUpdated={true}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {favorites.length > itemsPerPage && (
              <div className="flex items-center justify-center mt-12 gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2 mx-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${page === currentPage
                        ? 'bg-white/20 border border-white/30 text-white shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white'
                        }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Pagination Info */}
            {favorites.length > 0 && (
              <div className="text-center mt-6 text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, favorites.length)} of {favorites.length} favorite vaults
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 