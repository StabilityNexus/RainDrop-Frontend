'use client';

import { useState } from 'react';
import { ChevronDown, Globe, Network } from 'lucide-react';

interface ChainOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface ChainSelectorProps {
  selectedChain: string;
  onChainSelect: (chainId: string) => void;
  className?: string;
}

const chainOptions: ChainOption[] = [
  {
    id: 'all',
    name: 'All Networks',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-gray-400',
  },
  {
    id: 'scroll-sepolia',
    name: 'Scroll Sepolia',
    icon: (
      <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    ),
    color: 'text-orange-400',
  },
];

export default function ChainSelector({ 
  selectedChain, 
  onChainSelect, 
  className = '' 
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = chainOptions.find(option => option.id === selectedChain) || chainOptions[0];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg flex items-center justify-between transition-all duration-200 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
      >
        <div className="flex items-center gap-2">
          <div className={selectedOption.color}>
            {selectedOption.icon}
          </div>
          <span className="font-medium">{selectedOption.name}</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg z-20 overflow-hidden">
            {chainOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChainSelect(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors duration-200 ${
                  selectedChain === option.id ? 'bg-white/5' : ''
                }`}
              >
                <div className={option.color}>
                  {option.icon}
                </div>
                <span className="text-sm font-medium text-gray-200">{option.name}</span>
                {selectedChain === option.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 