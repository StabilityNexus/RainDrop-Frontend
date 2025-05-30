'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicClient } from '@wagmi/core';
import { config } from '@/utils/config';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, PlusCircle } from 'lucide-react';


import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';

interface VaultDetail {
  address: `0x${string}`;
  name: string;
  symbol: string;
  coin: `0x${string}`;
  vaultCreatorFee: number;
  treasuryFee: number;
}

export default function Explorer() {
  const router = useRouter();
  const [vaults, setVaults] = useState<VaultDetail[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publicClient = getPublicClient(config);
    const factory = RaindropFractoryAddress[534351] as `0x${string}`;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. How many vaults are in the factory?
        const total = (await publicClient.readContract({
          address: factory,
          abi: RAINDROP_FACTORY_ABI,
          functionName: 'vaultId',
        })) as bigint;

        // 2. Pull each Vault struct from `vaults[i]`
        const raw = await Promise.all(
          Array.from({ length: Number(total) }, (_, idx) => {
            const i = BigInt(idx + 1);
            return publicClient.readContract({
              address: factory,
              abi: RAINDROP_FACTORY_ABI,
              functionName: 'vaults',
              args: [i],
            });
          })
        ) as Array<[
          `0x${string}`, // vaultAddress
          string,        // name
          `0x${string}`, // coin
          string         // symbol
        ]>;

        // 3. Enrich each vault with on-chain stats
        const detailed = await Promise.all(
          raw.map(async ([vaultAddress, name, coin, symbol]) => {
            const [creatorFee, treasuryFee] = await Promise.all([
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
            ]) as [bigint, bigint];

            return {
              address: vaultAddress,
              name,
              symbol,
              coin,
              vaultCreatorFee: Number(creatorFee),
              treasuryFee: Number(treasuryFee),
            };
          })
        );

        setVaults(detailed);
      } catch (e) {
        console.error('Explorer load failed:', e);
        setError('Unable to load vaults.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = vaults.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
      
      <div className="w-full max-w-7xl mx-auto px-4 mt-24">
        <div className="mb-12">
          <div className="relative">
            {/* Glowing background effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
            
            {/* Main container */}
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
              
              {/* Content container */}
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff]">
                    Explore Vaults
                  </h1>
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2"></div>

                  <div className="relative w-full md:w-1/3">
                    {/* Glowing background effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    
                    {/* Search input container */}
                    <div className="relative">
                      <Input
                        placeholder="Search by name or symbol…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#232c3b] border-[#3673F5] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-6xl mx-auto px-4 text-center mt-18'>
          {loading ? (
            <div className="text-center text-gray-300">Loading vaults…</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center">
              <div className="relative inline-block">
                {/* Glowing background effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
                
                {/* Main container */}
                <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
                  
                  {/* Content container */}
                  <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-12 py-8">
                    <p className="text-gray-300">No vaults found{search && ` for "${search}"`}.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(vault => (
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
                          <p className="text-sm text-gray-400">Creator Fee: {vault.vaultCreatorFee}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <p className="text-sm text-gray-400">Treasury Fee: {vault.treasuryFee}%</p>
                        </div>
                      </div>
                      <div className="relative">
                      <Button
                        type="submit"
                        className="w-full max-w-lg mt-4 bg-green-500 hover:bg-green-600 text-white font-bold text-md py-3 rounded-lg transition-colors"
                      >
                        Go to Details <ArrowRight size={20} />
                      </Button>
                  </div>
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
