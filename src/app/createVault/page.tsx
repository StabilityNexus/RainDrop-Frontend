'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, PlusCircle, Coins, Shield, DollarSign, Info } from 'lucide-react';

import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';
import { ERC20Abi } from '@/utils/contractABI/ERC20';
import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { isAddress } from 'viem';

export default function CreateVault() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    coin: '',
    creatorAddress: '',
    vaultCreatorFee: '',
  });
  const [showInfo, setShowInfo] = useState<{ [key: string]: boolean }>({});
  const [underlyingSymbol, setUnderlyingSymbol] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read underlying token symbol
  const { data: tokenSymbol } = useReadContract({
    address: formData.coin as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'symbol',
    query: {
      enabled: isAddress(formData.coin),
    },
  });

  // Pre-fill creator address with connected wallet address
  useEffect(() => {
    if (isConnected && address && !formData.creatorAddress) {
      setFormData(prev => ({ ...prev, creatorAddress: address }));
    }
  }, [isConnected, address, formData.creatorAddress]);

  // Pre-fill symbol with "h" prefix when underlying token symbol is available
  useEffect(() => {
    if (tokenSymbol && typeof tokenSymbol === 'string' && tokenSymbol !== underlyingSymbol) {
      setUnderlyingSymbol(tokenSymbol);
      setFormData(prev => ({ ...prev, symbol: `h${tokenSymbol}` }));
    }
  }, [tokenSymbol, underlyingSymbol]);

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Validate vault creator fee
    if (key === 'vaultCreatorFee') {
      const fee = parseFloat(value);
      if (value && (isNaN(fee) || fee < 0 || fee > 100)) {
        setValidationError('Vault Creator Fee must be between 0-100%');
      } else {
        setValidationError('');
      }
    }
  };

  const toggleInfo = (fieldId: string) => {
    setShowInfo(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setValidationError('Please connect your wallet');
      return;
    }

    // Validate fee is between 0-100%
    const fee = parseFloat(formData.vaultCreatorFee);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      setValidationError('Vault Creator Fee must be between 0-100%');
      return;
    }

    // Clear any previous errors
    setValidationError('');

    try {
      // Convert percentage to contract units (multiply by 1000) since DENOMINATOR = 100000
      const feeInBasisPoints = Math.round(fee * 1000);
      
      await writeContract({
        address: RaindropFractoryAddress[534351],
        abi: RAINDROP_FACTORY_ABI,
        functionName: 'createVault',
        args: [
          formData.name,
          formData.symbol,
          formData.coin as `0x${string}`,
          formData.creatorAddress as `0x${string}`,
          BigInt(feeInBasisPoints),
          BigInt(0), // Default treasury fee set to 0
        ],
      });
    } catch (err) {
      console.error('Transaction error:', err);
      setValidationError('Transaction failed. Please try again.');
    }
  };

  if (isSuccess) router.push('/myVaults');

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
      
      <div className="w-full mt-24 max-w-4xl relative group transform transition-all duration-300 hover:scale-[1.02]">
        {/* Background glow effect */}
        <div className="absolute -inset-0.5 bg-white opacity-5 blur rounded-2xl group-hover:opacity-10 transition duration-300"></div>
        
        {/* Card content */}
        <div className="relative bg-[#1E1E1E] rounded-2xl border border-gray-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_48px_rgba(255,255,255,0.2)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] rounded-2xl animate-gradient-x"></div>
          <div className="relative bg-[#1E1E1E] m-[1px] rounded-2xl p-8">
            {/* Header with Back Button and Title */}
            <div className="flex items-center justify-between mb-8 mt-4">
              <Button
                onClick={() => router.push('/explorer')}
                className="bg-transparent hover:bg-gray-800/50 text-white font-futuristic flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700/50 transition-all duration-300 hover:scale-105 hover:border-white/50 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Back to Explorer
              </Button>
              
              <div className="flex flex-col items-center">
                <h1 className="font-futuristic text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2 text-center">
                  Create Vault
                </h1>
                <div className="relative mx-auto w-64 h-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
                </div>
              </div>
              
              {/* Empty div for centering the title */}
              <div className="w-[140px]"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vault Name */}
              <div className="space-y-3">
                <label htmlFor="name" className="text-emerald-300 font-medium font-futuristic text-sm">Vault Name</label>
                <div className="relative">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="My Awesome Vault"
                    required
                    className="relative w-full bg-[#1a2332] border-emerald-500/30 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-futuristic h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInfo('name')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Info className="w-5 h-5 text-emerald-400" />
                  </button>
                </div>
                {showInfo.name && (
                  <p className="text-sm text-white -mt-1">Enter a unique name for your vault</p>
                )}
              </div>

              {/* Staking Token Address */}
              <div className="space-y-3">
                <label htmlFor="coin" className="text-[#7ecbff] font-medium font-futuristic text-sm">Staking Token Address</label>
                <div className="relative">
                  <Input
                    id="coin"
                    value={formData.coin}
                    onChange={e => handleChange('coin', e.target.value)}
                    placeholder="0x1234567890abcdef..."
                    required
                    className="relative w-full bg-[#1a2332] border-[#3673F5]/30 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent font-futuristic h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInfo('coin')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Info className="w-5 h-5 text-[#7ecbff]" />
                  </button>
                </div>
                {showInfo.coin && (
                  <p className="text-sm text-white -mt-1">The token contract address that will be staked in this vault</p>
                )}
              </div>

              {/* Vault Symbol */}
              <div className="space-y-3">
                <label htmlFor="symbol" className="text-emerald-300 font-medium font-futuristic text-sm">Vault Symbol</label>
                <div className="relative">
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={e => handleChange('symbol', e.target.value)}
                    placeholder="hTKN"
                    required
                    className="relative w-full bg-[#1a2332] border-emerald-500/30 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-futuristic h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInfo('symbol')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Info className="w-5 h-5 text-emerald-400" />
                  </button>
                </div>
                {showInfo.symbol && (
                  <p className="text-sm text-white -mt-1">Auto-filled with "h" prefix. A short identifier for your vault token (e.g. hBTC, hETH)</p>
                )}
              </div>

              {/* Creator Address */}
              <div className="space-y-3">
                <label htmlFor="creatorAddress" className="text-[#7ecbff] font-medium font-futuristic text-sm">Creator Address</label>
                <div className="relative">
                  <Input
                    id="creatorAddress"
                    value={formData.creatorAddress}
                    onChange={e => handleChange('creatorAddress', e.target.value)}
                    placeholder="0x1234567890abcdef..."
                    required
                    className="relative w-full bg-[#1a2332] border-[#3673F5]/30 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#3673F5] focus:border-transparent font-futuristic h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInfo('creatorAddress')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Info className="w-5 h-5 text-[#7ecbff]" />
                  </button>
                </div>
                {showInfo.creatorAddress && (
                  <p className="text-sm text-white -mt-1">Auto-filled with your wallet address. The address that will receive creator fees from this vault</p>
                )}
              </div>

              {/* Vault Creator Fee */}
              <div className="space-y-3">
                <label htmlFor="vaultCreatorFee" className="text-purple-300 font-medium font-futuristic text-sm">Vault Creator Fee (%)</label>
                <div className="relative">
                  <Input
                    id="vaultCreatorFee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.vaultCreatorFee}
                    onChange={e => handleChange('vaultCreatorFee', e.target.value)}
                    placeholder="4 (for 4%)"
                    required
                    className={`relative w-full bg-[#1a2332] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent font-futuristic h-12 pr-10 ${
                      validationError && formData.vaultCreatorFee ? 
                      'border-red-500/50 focus:ring-red-500' : 
                      'border-purple-500/30 focus:ring-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleInfo('vaultCreatorFee')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Info className="w-5 h-5 text-purple-300" />
                  </button>
                </div>
                {showInfo.vaultCreatorFee && (
                  <p className="text-sm text-white -mt-1">
                    Enter a percentage between 0-100%. For example: 4 for 4%, 2.5 for 2.5%.
                    <br />
                    <span className="text-gray-400">Note: Treasury fee will be automatically calculated as max(0.3%, 10% of creator fee)</span>
                  </p>
                )}
                
                {/* Fee Preview */}
                {formData.vaultCreatorFee && !validationError && (
                  <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 text-center">
                    <p className="text-purple-300 font-futuristic text-sm">
                      Preview: Creator Fee {formData.vaultCreatorFee}% + Treasury Fee {Math.max(0.3, parseFloat(formData.vaultCreatorFee) * 0.1).toFixed(2)}% = 
                      <span className="font-bold text-white"> Total {(parseFloat(formData.vaultCreatorFee) + Math.max(0.3, parseFloat(formData.vaultCreatorFee) * 0.1)).toFixed(2)}%</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
                  <p className="text-red-400 font-futuristic text-sm">{validationError}</p>
                </div>
              )}

              <div className="relative mt-8 flex justify-center">
                <Button
                  type="submit"
                  className="relative w-72 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed font-futuristic"
                  disabled={isLoading || !!validationError}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      Create Vault
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}