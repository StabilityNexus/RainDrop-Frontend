'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { config } from '@/utils/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight, PlusCircle } from 'lucide-react';

import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';

interface VaultDetail {
  address: `0x${string}`;
  name: string;
  symbol: string;
  vaultCreatorFee: number;
  treasuryFee: number;
}

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

    const publicClient = getPublicClient(config);
    const factoryAddress = RaindropFractoryAddress[534351] as `0x${string}`;

    const fetchVaults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. pull your vault addresses from the factory
        const vaultAddrs = (await publicClient.readContract({
          address: factoryAddress,
          abi: RAINDROP_FACTORY_ABI,
          functionName: 'getVaults',
          args: [address],
        })) as `0x${string}`[];

        // 2. for each vault address, read the actual RainDrop contract
        const details = await Promise.all(
          vaultAddrs.map(async (vaultAddr) => {
            // read name()
            const name = (await publicClient.readContract({
              address: vaultAddr,
              abi: RAINDROP_ABI,
              functionName: 'name',
            })) as string;

            // read symbol()
            const symbol = (await publicClient.readContract({
              address: vaultAddr,
              abi: RAINDROP_ABI,
              functionName: 'symbol',
            })) as string;

            // read vaultCreatorFee()
            const creatorFee = (await publicClient.readContract({
              address: vaultAddr,
              abi: RAINDROP_ABI,
              functionName: 'vaultCreatorFee',
            })) as bigint;

            // read treasuryFee()
            const treasuryFee = (await publicClient.readContract({
              address: vaultAddr,
              abi: RAINDROP_ABI,
              functionName: 'treasuryFee',
            })) as bigint;

            return {
              address: vaultAddr,
              name,
              symbol,
              vaultCreatorFee: Number(creatorFee),
              treasuryFee: Number(treasuryFee),
            };
          })
        );

        setVaults(details);
      } catch (err) {
        console.error('Failed to fetch vaults:', err);
        setError('Failed to load your vaults.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaults();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
        
        <div className="max-w-4xl mx-auto px-4 text-center mt-24">
          <div className="relative">
            {/* Glowing background effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
            
            {/* Main container */}
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
              
              {/* Content container */}
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-12 py-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] mb-4">Connect Your Wallet</h1>
                <p className="text-gray-300">Please connect your wallet to view your vaults.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
      
      <div className="w-full max-w-7xl mx-auto px-4 mt-24">
        <div className="flex justify-between items-center mb-12">
          <div className="relative">
            {/* Glowing background effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
            
            {/* Main container */}
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              {/* Animated gradient border */}
              
              {/* Content container */}
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-8 py-4">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff]">My Vaults</h1>
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2"></div>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => router.push('/createVault')}
            className="relative group"
          >
            {/* Glowing background effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            {/* Main container */}
            <div className="relative bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
              Create New Vault
            </div>
          </Button>
        </div>

        <div className='max-w-6xl mx-auto px-4 text-center mt-18'>
          {isLoading ? (
            <div className="text-center text-gray-300">Loading vaults...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : vaults.length === 0 ? (
            <div className="text-center">
              <div className="relative inline-block">
                {/* Glowing background effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
                
                {/* Main container */}
                <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
                  
                  {/* Content container */}
                  <div className="relative bg-green-900 m-[2px] rounded-2xl px-12 py-8">
                    <p className="text-gray-300 mb-6">You haven't created any vaults yet.</p>
                    <Button
                      onClick={() => router.push('/createVault')}
                      className="bg-[#3673F5] hover:bg-[#2d5fd1] text-white"
                    >
                      Create Your First Vault
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaults.map((vault) => (
                <div key={vault.address} className="relative group">
                  {/* Glowing background effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  
                  {/* Main container */}
                  <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
                    
                    {/* Content container */}
                    <div 
                      className="relative bg-[#232c3b] m-[2px] rounded-2xl p-6 cursor-pointer hover:bg-[#2a3444] transition-colors"
                      onClick={() => router.push(`/vault/${vault.address}`)}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-r from-[#3673F5] to-[#7ecbff] p-2 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff]">
                          {vault.name}
                        </h2>
                        <h3 className="text-blue-500 font-bold mb-4">{vault.symbol}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#3673F5]"></div>
                          <p className="text-sm text-gray-400">
                            Creator Fee: {vault.vaultCreatorFee}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <p className="text-sm text-gray-400">
                            Treasury Fee: {vault.treasuryFee}%
                          </p>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full max-w-lg mt-4 bg-green-500 hover:bg-green-600 text-white font-bold text-md py-3 rounded-lg transition-colors"
                      >
                        Go to Details <ArrowRight size={20} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
