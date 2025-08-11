'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { indexedDBManager, VaultData } from '@/utils/indexedDB';
import { config } from '@/utils/config';
import { RaindropFractoryAddress } from '@/utils/contractAddress';
import { RAINDROP_FACTORY_ABI } from '@/utils/contractABI/RaindropFactory';

interface VaultCardProps {
  vault: VaultData;
  onFavoriteToggle?: (vaultAddress: string, isFavorite: boolean) => void;
  showLastUpdated?: boolean;
}

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function VaultCard({ vault, onFavoriteToggle, showLastUpdated = false }: VaultCardProps) {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();
  const [isFavorite, setIsFavorite] = useState(vault.isFavorite || false);
  const [isToggling, setIsToggling] = useState(false);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    if (num < 1) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling || !isConnected || !userAddress) return;
    
    setIsToggling(true);
    try {
      const factoryAddress = RaindropFractoryAddress[534351] as `0x${string}`;
      const newFavoriteStatus = !isFavorite;
      
      // Call the appropriate contract function
      if (newFavoriteStatus) {
        // Adding to favorites - call addInteraction
        const hash = await writeContract(config, {
          address: factoryAddress,
          abi: RAINDROP_FACTORY_ABI,
          functionName: 'addInteraction',
          args: [userAddress, vault.address as `0x${string}`],
        });
        
        await waitForTransactionReceipt(config, { hash });
      } else {
        // Removing from favorites - call removeInteraction
        const hash = await writeContract(config, {
          address: factoryAddress,
          abi: RAINDROP_FACTORY_ABI,
          functionName: 'removeInteraction',
          args: [vault.address as `0x${string}`],
        });
        
        await waitForTransactionReceipt(config, { hash });
      }
      
      // Update local state and IndexedDB after successful contract call
      setIsFavorite(newFavoriteStatus);
      
      // Update the vault in IndexedDB with the new favorite status using user-specific method
      await indexedDBManager.toggleFavorite(vault.address, userAddress);
      
      // Notify parent component if callback provided
      if (onFavoriteToggle) {
        onFavoriteToggle(vault.address, newFavoriteStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          console.log('Transaction rejected by user');
        } else {
          console.error('Failed to update favorite status:', error.message);
        }
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/r?vault=${vault.address}&chainId=534351`);
  };

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 min-w-[240px]"
      onClick={handleCardClick}
    >
      {/* Background glow effect */}
      <div className="absolute -inset-0.5 bg-white opacity-5 blur rounded-xl group-hover:opacity-10 transition duration-300"></div>
      
      {/* Card content */}
      <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-hover:shadow-[0_16px_32px_rgba(255,255,255,0.1)] transition-all duration-300">
        <div className="flex flex-col gap-3">
          {/* Vault Name and Star */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-blue-200 tracking-tight">{vault.name}</h3>
            {isConnected && (
              <Button
                onClick={handleFavoriteToggle}
                disabled={isToggling || !isConnected}
                className={`${
                  isFavorite
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-400 hover:from-yellow-600 hover:to-orange-500 border-yellow-400'
                    : 'bg-white/10 hover:bg-white/20 border-white/30'
                } text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors border-2 shadow-lg disabled:opacity-50 p-0`}
                title={!isConnected ? 'Connect wallet to favorite vaults' : (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
              >
                <Star 
                  size={14} 
                  className={`${isFavorite ? 'fill-current' : ''} ${isToggling ? 'animate-pulse' : ''}`} 
                />
              </Button>
            )}
          </div>

          {/* Vault Symbol and Chain */}
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[0.85rem] font-medium text-purple-300">{vault.symbol} Vault</p>
            <span className="text-gray-500">•</span>
            <p className="text-[0.85rem] text-emerald-400">Scroll Sepolia</p>
          </div>

          {/* Stats Column */}
          <div className="flex px-4 flex-col gap-2">
            {/* TVL Box */}
            <div className="bg-[#1E1E1E] rounded-lg px-3 py-2 flex items-center justify-between">
              <p className="text-md text-[#7ecbff]">TVL</p>
              <div className="flex items-center gap-1.5">
                <p className="text-white text-md font-medium">{formatBalance(vault.totalStaked)}</p>
                <span className="text-gray-400">{vault.coinSymbol}</span>
              </div>
            </div>

            {/* Total Fee Box */}
            <div className="bg-[#1E1E1E] rounded-lg px-3 py-2 flex items-center justify-between">
              <p className="text-md text-gray-300">Total Fee</p>
              <p className="text-white text-md font-medium">{((vault.vaultCreatorFee + vault.treasuryFee) / 1000).toFixed(2)}%</p>
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

          {/* Last Updated */}
          {showLastUpdated && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Last updated: {new Date(vault.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 