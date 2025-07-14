'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, TrendingUp, Users, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { indexedDBManager, VaultData } from '@/utils/indexedDB';

interface VaultCardProps {
  vault: VaultData;
  onFavoriteToggle?: (vaultAddress: string, isFavorite: boolean) => void;
  showLastUpdated?: boolean;
}

export function VaultCard({ vault, onFavoriteToggle, showLastUpdated = false }: VaultCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(vault.isFavorite || false);
  const [isToggling, setIsToggling] = useState(false);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      const newFavoriteStatus = await indexedDBManager.toggleFavorite(vault.address);
      setIsFavorite(newFavoriteStatus);
      
      // Update the vault in IndexedDB with the new favorite status
      const updatedVault = { ...vault, isFavorite: newFavoriteStatus };
      await indexedDBManager.saveVault(updatedVault);
      
      // Notify parent component if callback provided
      if (onFavoriteToggle) {
        onFavoriteToggle(vault.address, newFavoriteStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/vault/${vault.address}`);
  };

  return (
    <div
      className="relative group cursor-pointer transition-all hover:scale-105"
      onClick={handleCardClick}
    >
      <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden border-2 border-emerald-500/60 hover:border-emerald-400">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 animate-gradient-x"></div>
        <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-6">
          {/* Header with Star */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white font-futuristic truncate">
              {vault.name}
            </h3>
            <Button
              onClick={handleFavoriteToggle}
              disabled={isToggling}
              className={`${
                isFavorite
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-400 hover:from-yellow-600 hover:to-orange-500 border-yellow-400'
                  : 'bg-white/10 hover:bg-white/20 border-white/30'
              } text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors border-2 shadow-lg`}
            >
              <Star 
                size={18} 
                className={`${isFavorite ? 'fill-current' : ''} ${isToggling ? 'animate-pulse' : ''}`} 
              />
            </Button>
          </div>

          {/* Vault Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="text-[#7ecbff]" size={16} />
              <span className="text-sm text-gray-300">Symbol:</span>
              <span className="text-sm text-white font-bold">{vault.symbol}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={16} />
              <span className="text-sm text-gray-300">TVL:</span>
              <span className="text-sm text-white font-bold">
                {formatBalance(vault.totalStaked)} {vault.coinSymbol}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="text-purple-400" size={16} />
              <span className="text-sm text-gray-300">Supply:</span>
              <span className="text-sm text-white font-bold">
                {formatBalance(vault.totalSupply)} {vault.symbol}
              </span>
            </div>
          </div>

          {/* Address */}
          <div className="mt-4 p-3 bg-[#1a2332] rounded-lg">
            <p className="text-xs text-gray-400 font-mono">
              {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
            </p>
          </div>

          {/* Last Updated */}
          {showLastUpdated && (
            <div className="mt-3 text-xs text-gray-500">
              Last updated: {new Date(vault.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 