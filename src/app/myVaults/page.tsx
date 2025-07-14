'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { config } from '@/utils/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight, PlusCircle, Coins, Shield, TrendingUp, Users, Activity, Target, Wallet, Vault, User2 } from 'lucide-react';

import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';
import { ERC20Abi } from '@/utils/contractABI/ERC20';

interface VaultDetail {
  address: `0x${string}`;
  name: string;
  symbol: string;
  coin: `0x${string}`;
  vaultCreatorFee: number;
  treasuryFee: number;
  tvl: number;
  tokenSymbol: string;
  apr: number;
  creator: `0x${string}`;
}

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const LoadingSkeleton = () => (
  <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 shadow-[0_8px_16px_rgba(0,0,0,0.4)] animate-pulse flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
      <div className="space-y-2">
        <div className="h-5 w-24 bg-gray-700 rounded"></div>
        <div className="h-4 w-16 bg-gray-700 rounded"></div>
      </div>
    </div>
    
    <div className="flex flex-col gap-3 py-4 border-y border-gray-800">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-4 w-20 bg-gray-700 rounded"></div>
          <div className="h-4 w-16 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-gray-700 rounded"></div>
      <div className="h-8 w-24 bg-gray-700 rounded"></div>
    </div>
  </div>
);

const VaultCard = ({ vault }: { vault: VaultDetail }) => {
  const router = useRouter();

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 min-w-[240px]"
      onClick={() => router.push(`/vault/${vault.address}`)}
    >
      {/* Background glow effect */}
      <div className="absolute -inset-0.5 bg-white opacity-5 blur rounded-xl group-hover:opacity-10 transition duration-300"></div>
      
      {/* Card content */}
      <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-hover:shadow-[0_16px_32px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="flex flex-col gap-3">
          {/* Chain Name Badge */}
          <div className="absolute top-3 right-3">
            <div className="bg-[#2a2a2a] px-2 py-1 rounded-full border border-gray-700">
              <p className="text-xs font-medium text-emerald-400">Scroll Sepolia</p>
            </div>
          </div>

          {/* Vault Name and Symbol */}
          <div className="flex flex-col items-start text-left mb-1">
            <h3 className="text-xl font-bold text-blue-200 tracking-tight">{vault.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[0.85rem] font-medium text-purple-300">{vault.symbol} Vault</p>
              <span className="text-gray-500">•</span>
              <p className="text-[0.85rem] text-gray-400">{shortenAddress(vault.address)}</p>
            </div>
          </div>

          {/* Stats Column */}
          <div className="flex px-4 flex-col gap-2">
            {/* TVL Box */}
            <div className="bg-[#1E1E1E] rounded-lg px-3 py-2 flex items-center justify-between">
              <p className="text-md text-[#7ecbff]">TVL</p>
              <div className="flex items-center gap-1.5">
                <p className="text-white text-md font-medium">{vault.tvl}</p>
                <span className="text-gray-400">{vault.tokenSymbol}</span>
              </div>
            </div>

            {/* Total Fee Box */}
            <div className="bg-[#1E1E1E] rounded-lg px-3 py-2 flex items-center justify-between">
              <p className="text-md text-bold text-purple-400">Total Fee</p>
              <p className="text-white text-md font-medium">{vault.vaultCreatorFee + vault.treasuryFee}%</p>
            </div>
          </div>

          {/* Enter Button */}
          <div className="flex justify-center px-4">
            <button 
              className="group bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/20 overflow-hidden relative whitespace-nowrap w-full"
            >
              <div className="px-4 py-2 flex items-center justify-center gap-2 group-hover:translate-x-2 transition-transform duration-300">
                Enter Vault
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyVaults() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [vaults, setVaults] = useState<VaultDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setVaults([]);
      return;
    }

    const fetchVaults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const publicClient = getPublicClient(config);
        const factoryAddress = RaindropFractoryAddress[534351] as `0x${string}`;

        // Get all vaults
        const allVaults = await publicClient.readContract({
          address: factoryAddress,
          abi: RAINDROP_FACTORY_ABI,
          functionName: 'getVaults',
          args: [address as `0x${string}`],
        }) as `0x${string}`[];

        // Get details for each vault
        const vaultDetails = await Promise.all(allVaults.map(async (vaultAddress) => {
          try {
            // Basic vault info
            const [name, symbol, coin, creatorFee, treasuryFee, vaultCreator] = await Promise.all([
              publicClient.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'name',
              }),
              publicClient.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'symbol',
              }),
              publicClient.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'coin',
              }),
              publicClient.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'vaultCreatorFee',
              }),
              publicClient.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'treasuryFee',
              }),
              publicClient.readContract({
                address: vaultAddress,
                abi: RAINDROP_ABI,
                functionName: 'vaultCreator',
              }),
            ]) as [string, string, `0x${string}`, bigint, bigint, `0x${string}`];

            // Only include vaults where the user is the creator
            if (vaultCreator.toLowerCase() !== address?.toLowerCase()) {
              return null;
            }

            // Get token symbol from the ERC20 contract
            let tokenSymbol = '';
            try {
              const result = await publicClient.readContract({
                address: coin,
                abi: ERC20Abi,
                functionName: 'symbol',
              });
              tokenSymbol = result as string;
            } catch (err) {
              console.error('Error fetching token symbol:', err);
              tokenSymbol = 'UNKNOWN';
            }

            // Get TVL using token balance of vault contract
            let tvl = 0;
            try {
              const [rawBalance, decimalsRaw] = await Promise.all([
                publicClient.readContract({
                  address: coin,
                  abi: ERC20Abi,
                  functionName: 'balanceOf',
                  args: [vaultAddress],
                }) as Promise<bigint>,
                publicClient.readContract({
                  address: coin,
                  abi: ERC20Abi,
                  functionName: 'decimals',
                }) as Promise<bigint | number>,
              ]);

              const decimals = typeof decimalsRaw === 'bigint' ? Number(decimalsRaw) : decimalsRaw;
              tvl = Number(rawBalance) / Math.pow(10, decimals);
            } catch (err) {
              console.error('Error fetching TVL:', err);
            }

            return {
              address: vaultAddress,
              name,
              symbol,
              coin,
              vaultCreatorFee: Number(creatorFee),
              treasuryFee: Number(treasuryFee),
              tvl: tvl,
              tokenSymbol,
              apr: 0, // APR calculation would need to be implemented based on rewards
              creator: vaultCreator as `0x${string}`, // Using the actual creator address
            } as VaultDetail;
          } catch (err) {
            console.error(`Error fetching details for vault ${vaultAddress}:`, err);
            return null;
          }
        }));

        // Filter out any failed vault fetches and non-creator vaults
        const validVaults = vaultDetails
          .filter((vault): vault is NonNullable<typeof vault> => vault !== null)
          .map(vault => ({
            ...vault,
            creator: vault.creator as `0x${string}`
          }));
        setVaults(validVaults);
      } catch (err) {
        console.error('Error fetching vaults:', err);
        setError('Failed to fetch vaults. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaults();
  }, [address, isConnected]);

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden" style={{ background: '#1E1E1E' }}>
        {/* Scanline overlay */}
        <div className="pointer-events-none px-0 fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
        
        <div className="w-full mt-28 z-10">
          {/* Header Section */}
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 mb-12">
            <div className="relative">
              <div className="relative rounded-3xl px-8 py-8">
                <div className="flex flex-col gap-6">
                  {/* Title and Create Button Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <h1 className="font-futuristic text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2">
                          My Vaults
                        </h1>
                        <div className="relative mx-auto w-64 h-1">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/createVault')}
                      className="bg-[#4B96FF] hover:bg-[#4B96FF]/90 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-[#4B96FF]/25"
                    >
                      <PlusCircle className="h-5 w-5" />
                      Create Vault
                    </Button>
                                        </div>

                      {/* Network Filter */}
                  <div className="flex items-center justify-end">
                    <div className="relative w-[200px]">
                      <select
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm text-gray-200 cursor-pointer"
                        defaultValue="scroll-sepolia"
                      >
                        <option value="all" className="bg-[#1a1a1a]">All Networks</option>
                        <option value="scroll-sepolia" className="bg-[#1a1a1a]">Scroll Sepolia</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
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

          {/* Content */}
          <div className="px-6 sm:px-8 md:px-14 lg:px-20 xl:px-28 2xl:px-38 mb-12">
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/30 via-emerald-500/30 to-[#7ecbff]/30 rounded-2xl"></div>
                <div className="relative bg-[#232c3b] rounded-2xl border-2 border-emerald-500/50 px-12 py-12">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-emerald-500 to-green-400 w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-400">
                        <Wallet className="text-white" size={32} />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white font-futuristic mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-300 font-futuristic mb-6">Please connect your wallet to view and manage your vaults</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Main content for connected users
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
                {/* Title and Create Button Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] rounded-xl opacity-80"></div>
                    </div>
                    <div className="text-center">
                      <h1 className="font-futuristic text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2">
                        My Vaults
                      </h1>
                      <div className="relative mx-auto w-64 h-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push('/createVault')}
                    className="bg-[#4B96FF] hover:bg-[#4B96FF]/90 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-[#4B96FF]/25"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Create Vault
                  </Button>
                </div>

                {/* Network Filter */}
                <div className="flex items-center justify-end">
                  <div className="relative w-[200px]">
                    <select
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm text-gray-200 cursor-pointer"
                      defaultValue="scroll-sepolia"
                    >
                      <option value="all" className="bg-[#1a1a1a]">All Networks</option>
                      <option value="scroll-sepolia" className="bg-[#1a1a1a]">Scroll Sepolia</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
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

        {/* Content */}
        <div className="px-6 sm:px-8 md:px-14 lg:px-20 xl:px-28 2xl:px-38 mb-12">
          {error && (
            <div className="text-center py-8 mb-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {Array.from({ length: 6 }).map((_, idx) => (
                <LoadingSkeleton key={idx} />
              ))}
            </div>
          ) : vaults.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/30 via-emerald-500/30 to-[#7ecbff]/30 rounded-2xl"></div>
                <div className="relative bg-[#232c3b] rounded-2xl border-2 border-emerald-500/50 px-12 py-12">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-emerald-500 to-green-400 w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-400">
                        <PlusCircle className="text-white" size={32} />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white font-futuristic mb-4">No Vaults Yet</h3>
                  <p className="text-gray-300 font-futuristic mb-6">Create your first vault and start earning rewards!</p>
                  <Button
                    onClick={() => router.push('/createVault')}
                    className="bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white font-futuristic font-bold px-8 py-3 rounded-xl shadow-neon border-2 border-emerald-400"
                  >
                    Create First Vault
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {vaults.map((vault) => (
                <VaultCard key={vault.address} vault={vault} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
