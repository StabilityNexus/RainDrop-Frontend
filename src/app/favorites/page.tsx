'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { formatUnits } from 'viem';
import { RefreshCw, Heart, ArrowLeft } from 'lucide-react';

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
      const cachedFavorites = await indexedDBManager.getFavoriteVaults();
      
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
    <div className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)' }} />

      {/* Raindrop Animation */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {[
          ...[...Array(3)].map(() => ({
            leftPercent: Math.random() * 49,
            color: 'green',
          })),
          ...[...Array(3)].map(() => ({
            leftPercent: 50 + Math.random() * 49,
            color: 'blue',
          }))
        ].map((drop, i) => {
          const left = `${drop.leftPercent}%`;
          const delay = `${Math.random() * 3}s`;
          const duration = `${3 + Math.random() * 2}s`;
          const dropClass = drop.color === 'green'
            ? "bg-gradient-to-b from-green-400 to-emerald-500"
            : "bg-gradient-to-b from-[#7ecbff] to-[#3673F5]";
          return (
            <div
              key={i}
              className="absolute top-0 animate-rain"
              style={{
                left,
                animationDelay: delay,
                animationDuration: duration,
              }}
            >
              <div className={`w-[2px] h-8 ${dropClass} rounded-full shadow-lg opacity-40`}></div>
            </div>
          );
        })}
      </div>

      <div className="w-full mt-24 mb-12 z-10 space-y-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 px-4 py-2 hover:bg-white/15 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} className="text-white" />
            <span className="text-white font-futuristic">Back</span>
          </Button>

          <div className="text-center">
            <h1 className="font-futuristic text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 font-bold tracking-wider mb-2">
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
            className="bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-lg hover:from-emerald-600 hover:to-green-500 transition-colors font-futuristic font-bold border-2 border-emerald-400 shadow-lg px-4 py-2 flex items-center gap-2"
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
                  className="bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-lg hover:from-purple-600 hover:to-pink-500 transition-colors font-futuristic font-bold border-2 border-purple-400 shadow-lg px-6 py-3"
                >
                  Explore Vaults
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {favorites.map((vault) => (
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
        )}
      </div>
    </div>
  );
} 