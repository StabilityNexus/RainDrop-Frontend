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
import { Sparkles, ArrowRight, PlusCircle, Search, TrendingUp, Users, Coins, Shield, Target, Activity, Vault, User2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';
import { ERC20Abi } from '@/utils/contractABI/ERC20';
import { indexedDBManager, VaultData } from '@/utils/indexedDB';
import { VaultCard } from '@/components/VaultCard';
import ChainSelector from '@/components/ChainSelector';



export default function Explorer() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedChain, setSelectedChain] = useState('scroll-sepolia');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadVaults();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadVaults = async () => {
    try {
      setError(null);
      await indexedDBManager.init();

      // First, try to load from IndexedDB
      const cachedVaults = await indexedDBManager.getAllVaults();

      if (cachedVaults.length > 0) {
        setVaults(cachedVaults);
        setLoading(false); // Hide loading since we have cached data

        // Check if data is stale (older than 5 minutes)
        const hasStaleData = cachedVaults.some(vault =>
          Date.now() - vault.lastUpdated > 5 * 60 * 1000
        );

        if (!hasStaleData) {
          return; // Data is fresh, no need to sync
        }

        // If data is stale, sync in background without showing loading
        await syncVaults();
      } else {
        // No cached data, show loading and sync from blockchain
        setLoading(true);
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
    try {
      setSyncing(true);
      setError(null);
      const publicClient = getPublicClient(config);
      const factoryAddress = RaindropFractoryAddress[534351] as `0x${string}`;

      // Get user's favorite vaults from contract if connected
      let userFavorites: Set<string> = new Set();
      if (isConnected && address) {
        try {
          const userVaultHistory = await publicClient.readContract({
            address: factoryAddress,
            abi: RAINDROP_FACTORY_ABI,
            functionName: 'getUserVaultHistorySlice',
            args: [address, BigInt(0), BigInt(999)], // Get up to 1000 vaults
          }) as `0x${string}`[];

          userFavorites = new Set(userVaultHistory.map(addr => addr.toLowerCase()));

          // Sync favorites with IndexedDB
          await indexedDBManager.syncUserFavoritesFromContract(address, userVaultHistory);
        } catch (err) {
          console.error('Error fetching user favorites:', err);
          // Continue with empty favorites if this fails
        }
      }

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

              const [totalStaked, coinSymbol] = await Promise.all([
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
              ]) as [bigint, string];

              // Check if this vault is favorited by the user from the contract
              const isFavorite = userFavorites.has(vaultInfo.vaultAddress.toLowerCase());

              const vaultData: VaultData = {
                address: vaultInfo.vaultAddress,
                name: vaultInfo.name,
                symbol: vaultInfo.symbol,
                coin: vaultInfo.coin,
                coinSymbol,
                totalSupply: '0', // Not needed for explorer, set to default
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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVaults = filtered.slice(startIndex, endIndex);


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
    <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden bg-[#0D0F14]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#131822] via-[#0D0F14] to-[#0B0D12] opacity-90" />

      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#3673F5]/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-44 h-44 rounded-full bg-[#7ecbff]/15 blur-2xl animate-pulse animation-delay-4000" />
      </div>

      {/* Rain animation overlay */}
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
              <div className="w-[2px] h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full shadow-lg opacity-90" />
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
              <div className="w-[2px] h-8 bg-gradient-to-b from-[#7ecbff] to-[#3673F5] rounded-full shadow-lg opacity-90" />
            </div>
          );
        })}
      </div>

      <div className="w-full mt-28 z-10 flex-1 flex flex-col pb-8">
        {/* Header Section */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
          <div className="relative">
            <div className="relative rounded-3xl px-4 sm:px-8 py-6 sm:py-8">
              <div className="flex flex-col gap-6">
                {/* Title and Buttons Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                    <div className="text-center sm:text-left">
                      <h1 className="font-futuristic text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2">
                        Explore Vaults
                      </h1>
                      <div className="relative mx-auto sm:mx-0 w-48 sm:w-64 h-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
                    <Button
                      onClick={syncVaults}
                      disabled={syncing}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-3 sm:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                      <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
                    </Button>
                    <Button
                      onClick={() => router.push('/createVault')}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-3 sm:px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10 text-sm"
                    >
                      <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Create Vault</span>
                    </Button>
                  </div>
                </div>

                {/* Search and Filter Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-[300px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Search by token name or symbol"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Network Filter */}
                  <div className="w-full sm:w-[200px]">
                    <ChainSelector
                      selectedChain={selectedChain}
                      onChainSelect={setSelectedChain}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Vaults Grid */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
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
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Create First Vault
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
              {currentVaults.map((vault) => (
                <VaultCard
                  key={vault.address}
                  vault={vault}
                  onFavoriteToggle={handleFavoriteToggle}
                  showLastUpdated={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section: Pagination */}
        <div className="mt-auto pb-6">
          {/* Pagination Controls */}
          {filtered.length > itemsPerPage && (
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
          {filtered.length > 0 && (
            <div className="text-center mt-6 text-sm text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filtered.length)} of {filtered.length} vaults
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


//  0x9b04dab917f87847ed31865a0f7a6047a7ef94fa