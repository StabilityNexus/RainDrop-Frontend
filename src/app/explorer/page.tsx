'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { formatUnits } from 'viem';
import { config } from '@/utils/config';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, PlusCircle, Search, TrendingUp, Users, Coins, Shield, Target, Activity, Vault, User2, RefreshCw } from 'lucide-react';

import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';
import { ERC20Abi } from '@/utils/contractABI/ERC20';
import { indexedDBManager, VaultData } from '@/utils/indexedDB';
import { VaultCard } from '@/components/VaultCard';



export default function Explorer() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      setLoading(true);
      setError(null);
      await indexedDBManager.init();
      
      // First, try to load from IndexedDB
      const cachedVaults = await indexedDBManager.getAllVaults();
      
      if (cachedVaults.length > 0) {
        setVaults(cachedVaults);
        setLoading(false);
        
        // Check if data is stale (older than 5 minutes)
        const hasStaleData = cachedVaults.some(vault => 
          indexedDBManager.isDataStale(vault.lastUpdated)
        );
        
        if (!hasStaleData) {
          return; // Data is fresh, no need to sync
        }
      }
      
      // If no cached data or data is stale, fetch from blockchain
      if (isConnected) {
        await syncVaults();
      }
    } catch (err) {
      console.error('Error loading vaults:', err);
      setError('Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  const syncVaults = async () => {
    if (!isConnected) {
      setError('Please connect your wallet to sync');
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      const publicClient = getPublicClient(config);
      const factoryAddress = RaindropFractoryAddress[534351] as `0x${string}`;

      // Get total vault count
      const vaultId = await publicClient.readContract({
        address: factoryAddress,
        abi: RAINDROP_FACTORY_ABI,
        functionName: 'vaultId',
      }) as bigint;

      const totalVaults = Number(vaultId);
      
      if (totalVaults === 0) {
        setVaults([]);
        return;
      }

      // Get all vaults in batches to avoid overwhelming the RPC
      const batchSize = 10;
      const allVaults: VaultData[] = [];
      
      for (let i = 1; i <= totalVaults; i += batchSize) {
        const end = Math.min(i + batchSize - 1, totalVaults);
        
        try {
          const vaultSlice = await publicClient.readContract({
            address: factoryAddress,
            abi: RAINDROP_FACTORY_ABI,
            functionName: 'getVaultsSlice',
            args: [BigInt(i), BigInt(end)],
          }) as Array<{
            vaultAddress: `0x${string}`;
            name: string;
            symbol: string;
            coin: `0x${string}`;
          }>;

          // Get detailed info for each vault
          const vaultDetails = await Promise.all(vaultSlice.map(async (vaultInfo) => {
            try {
              const [vaultCreator, vaultCreatorFee, treasuryFee] = await Promise.all([
                publicClient.readContract({
                  address: vaultInfo.vaultAddress,
                  abi: RAINDROP_ABI,
                  functionName: 'vaultCreator',
                }),
                publicClient.readContract({
                  address: vaultInfo.vaultAddress,
                  abi: RAINDROP_ABI,
                  functionName: 'vaultCreatorFee',
                }),
                publicClient.readContract({
                  address: vaultInfo.vaultAddress,
                  abi: RAINDROP_ABI,
                  functionName: 'treasuryFee',
                }),
              ]) as [string, bigint, bigint];

              const [totalSupply, totalStaked, coinSymbol] = await Promise.all([
                publicClient.readContract({
                  address: vaultInfo.vaultAddress,
                  abi: ERC20Abi,
                  functionName: 'totalSupply',
                }),
                publicClient.readContract({
                  address: vaultInfo.coin,
                  abi: ERC20Abi,
                  functionName: 'balanceOf',
                  args: [vaultInfo.vaultAddress],
                }),
                publicClient.readContract({
                  address: vaultInfo.coin,
                  abi: ERC20Abi,
                  functionName: 'symbol',
                }),
              ]) as [bigint, bigint, string];

              // Check if this vault is favorited
              const existingVault = await indexedDBManager.getVault(vaultInfo.vaultAddress);
              const isFavorite = existingVault?.isFavorite || false;

              const vaultData: VaultData = {
                address: vaultInfo.vaultAddress,
                name: vaultInfo.name,
                symbol: vaultInfo.symbol,
                coin: vaultInfo.coin,
                coinSymbol,
                totalSupply: formatUnits(totalSupply, 18),
                totalStaked: formatUnits(totalStaked, 18),
                vaultCreator,
                vaultCreatorFee: Number(vaultCreatorFee),
                treasuryFee: Number(treasuryFee),
                lastUpdated: Date.now(),
                isFavorite,
              };

              // Save to IndexedDB
              await indexedDBManager.saveVault(vaultData);
              return vaultData;
            } catch (err) {
              console.error(`Error fetching vault ${vaultInfo.vaultAddress}:`, err);
              return null;
            }
          }));

          const validVaults = vaultDetails.filter((vault): vault is VaultData => vault !== null);
          allVaults.push(...validVaults);
        } catch (err) {
          console.error(`Error fetching vault slice ${i}-${end}:`, err);
        }
      }

      setVaults(allVaults);
    } catch (err) {
      console.error('Error syncing vaults:', err);
      setError('Failed to sync vaults from blockchain');
    } finally {
      setSyncing(false);
    }
  };

  const handleFavoriteToggle = (vaultAddress: string, isFavorite: boolean) => {
    setVaults(prev => 
      prev.map(vault => 
        vault.address === vaultAddress 
          ? { ...vault, isFavorite }
          : vault
      )
    );
  };

  const filtered = vaults.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.symbol.toLowerCase().includes(search.toLowerCase())
  );



  // Update loading skeleton to match new layout
  const LoadingSkeleton = () => (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 shadow-[0_8px_16px_rgba(0,0,0,0.4)] animate-pulse flex flex-col gap-4">
      {/* Name and Symbol */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-700 rounded"></div>
          <div className="h-4 w-16 bg-gray-700 rounded"></div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex flex-col gap-3 py-4 border-y border-gray-800">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-20 bg-gray-700 rounded"></div>
            <div className="h-4 w-16 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-gray-700 rounded"></div>
        <div className="h-8 w-24 bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden" style={{ background: '#1E1E1E' }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none px-0 fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
      
      <div className="w-full mt-28 z-10">
        {/* Header Section */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
          <div className="relative">
            <div className="relative rounded-3xl px-8 py-8">
              <div className="flex flex-col gap-6">
                {/* Title and Buttons Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] rounded-xl blur-sm"></div>
                    </div>
                    <div className="text-center">
                      <h1 className="font-futuristic text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2">
                        Explore Vaults
                      </h1>
                      <div className="relative mx-auto w-64 h-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={syncVaults}
                      disabled={syncing || !isConnected}
                      className="bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-lg hover:from-emerald-600 hover:to-green-500 transition-colors font-futuristic font-bold border-2 border-emerald-400 shadow-lg px-4 py-2.5 flex items-center gap-2"
                    >
                      <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                      <span>{syncing ? 'Syncing...' : 'Sync'}</span>
                    </Button>
                    <Button
                      onClick={() => router.push('/createVault')}
                      className="bg-[#4B96FF] hover:bg-[#4B96FF]/90 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-[#4B96FF]/25"
                    >
                      <PlusCircle className="h-5 w-5" />
                      Create Vault
                    </Button>
                  </div>
                </div>

                {/* Search and Filter Row */}
                <div className="flex items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative w-[300px] pl-12">
                    <div className="absolute inset-y-0 left-15 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Search by token name or symbol..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Network Filter */}
                  <div className="relative w-[200px] pr-8">
                    <select
                      className="w-full px-8 py-2 bg-white/5 border border-white/10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm text-gray-200 cursor-pointer"
                      defaultValue="scroll-sepolia"
                    >
                      <option value="all" className="bg-[#1a1a1a]">All Networks</option>
                      <option value="scroll-sepolia" className="bg-[#1a1a1a]">Scroll Sepolia</option>
                    </select>
                    <div className="absolute inset-y-0 right-11 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        {/* Vaults Grid */}
        <div className="px-6 sm:px-8 md:px-14 lg:px-20 xl:px-28 2xl:px-38 mb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {Array.from({ length: 6 }).map((_, idx) => (
                <LoadingSkeleton key={idx} />
              ))}
            </div>
          ) : error ? (
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/30 via-emerald-500/30 to-[#7ecbff]/30 rounded-2xl"></div>
                <div className="relative bg-[#232c3b] rounded-2xl px-12 py-12 border-2 border-emerald-500/50">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-emerald-500 to-green-400 w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-400">
                        <Target className="text-white" size={32} />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white font-futuristic mb-4">No Vaults Found</h3>
                  <p className="text-gray-300 font-futuristic mb-6">
                    {search ? 'No vaults match your search criteria.' : 'No vaults available yet.'}
                  </p>
                  <Button
                    onClick={() => router.push('/createVault')}
                    className="bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-lg hover:from-emerald-600 hover:to-green-500 transition-colors font-futuristic font-bold border-2 border-emerald-400 shadow-lg px-6 py-3"
                  >
                    Create First Vault
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filtered.map((vault) => (
                <VaultCard 
                  key={vault.address} 
                  vault={vault} 
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


//  0x9b04dab917f87847ed31865a0f7a6047a7ef94fa