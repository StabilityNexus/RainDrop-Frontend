'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { RaindropFractoryAddress } from '@/utils/contractAddress';

type TabType = 'Vault Info' | 'Addresses' | 'Fees';

export default function CreateVault() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('Vault Info');
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    coin: '',
    creatorAddress: '',
    treasuryAddress: '',
    vaultCreatorFee: '',
    treasuryFee: '',
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      console.warn('Please connect your wallet');
      return;
    }

    try {
      await writeContract({
        address: RaindropFractoryAddress[534351],
        abi: RAINDROP_FACTORY_ABI,
        functionName: 'createVault',
        args: [
          formData.name,
          formData.symbol,
          formData.coin,
          formData.creatorAddress,
          formData.treasuryAddress,
          BigInt(formData.vaultCreatorFee),
          BigInt(formData.treasuryFee),
        ],
      });
    } catch (err) {
      console.error('Transaction error:', err);
    }
  };

  if (isSuccess) router.push('/myVaults');

  return (
    <main className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
      
      {/* Header */}
      <header className="w-full max-w-5xl mt-24 z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="relative">
            {/* Glowing background effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
            
            {/* Main container */}
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
              
              {/* Content container */}
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-12 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <h1 className="font-futuristic text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] font-bold tracking-wider">
                        Create New Vault
                    </h1>
                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-3xl mt-12">
        <div className="relative">
          {/* Glowing background effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
          
          {/* Main container */}
          <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
            
            {/* Content container */}
            <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
              {/* Tab Navigation */}
              <div className="flex space-x-2 mb-6">
                {(['Vault Info', 'Addresses', 'Fees'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-[#3673F5] to-[#7ecbff] text-green-100'
                        : 'bg-[#2a3444] text-gray-300 hover:bg-[#323d4f]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vault Info Tab */}
                {activeTab === 'Vault Info' && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-green-100 font-medium">Vault Name</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-emerald-500/20 to-green-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="My Vault"
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-200 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="symbol" className="text-green-100 font-medium">Vault Symbol</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="symbol"
                            value={formData.symbol}
                            onChange={e => handleChange('symbol', e.target.value)}
                            placeholder="MVLT"
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Addresses Tab */}
                {activeTab === 'Addresses' && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="coin" className="text-green-100 font-medium">Staking Token Address</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="coin"
                            value={formData.coin}
                            onChange={e => handleChange('coin', e.target.value)}
                            placeholder="0x..."
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="creatorAddress" className="text-green-100 font-medium">Creator Address</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="creatorAddress"
                            value={formData.creatorAddress}
                            onChange={e => handleChange('creatorAddress', e.target.value)}
                            placeholder="0x..."
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="treasuryAddress" className="text-green-100 font-medium">Treasury Address</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="treasuryAddress"
                            value={formData.treasuryAddress}
                            onChange={e => handleChange('treasuryAddress', e.target.value)}
                            placeholder="0x..."
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Fees Tab */}
                {activeTab === 'Fees' && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="vaultCreatorFee" className="text-green-100 font-medium">Vault Creator Fee (%)</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="vaultCreatorFee"
                            type="number"
                            value={formData.vaultCreatorFee}
                            onChange={e => handleChange('vaultCreatorFee', e.target.value)}
                            placeholder="100 for 1%"
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="treasuryFee" className="text-green-100 font-medium">Treasury Fee (%)</label>
                      <div className="relative">
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        {/* Input container */}
                        <div className="relative">
                          <Input
                            id="treasuryFee"
                            type="number"
                            value={formData.treasuryFee}
                            onChange={e => handleChange('treasuryFee', e.target.value)}
                            placeholder="50 for 0.5%"
                            required
                            className="w-full bg-[#232c3b] border-[#3673F5] text-green-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="relative group pt-6">
                  {/* Glowing background effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  
                  {/* Button container */}
                  <div className="relative">
                    <Button
                      type="submit"
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-bold text-lg py-3 rounded-lg transition-colors font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Vault...' : 'Create Vault'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}