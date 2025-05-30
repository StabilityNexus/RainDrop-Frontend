'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { parseEther, formatUnits } from 'viem';

import { config } from '@/utils/config';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';
import { ERC20Abi } from '@/utils/contractABI/ERC20';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins } from 'lucide-react';

interface VaultDetailsState {
  name: string;
  symbol: string;
  vaultCreatorFee: bigint;
  treasuryFee: bigint;
}

export default function VaultDetails() {
  const { address: vaultAddress } = useParams<{ address: string }>();
  const { address: userAddress, isConnected } = useAccount();

  const [vault, setVault] = useState<VaultDetailsState | null>(null);
  const [coinAddress, setCoinAddress] = useState<`0x${string}` | null>(null);

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [balances, setBalances] = useState({
    coinBalance: '0',
    stakedBalance: '0',
    totalStaked: '0',
  });

  const [stakeAmt, setStakeAmt] = useState('');
  const [dropAmt, setDropAmt] = useState('');
  const [dropToken, setDropToken] = useState('');
  const [dropDeadline, setDropDeadline] = useState('');

  // 1) Load vault metadata + token-address
  useEffect(() => {
    if (!vaultAddress) return;

    const client = getPublicClient(config);
    setLoadingDetails(true);
    setError(null);

    Promise.all([
      client.readContract({ address: vaultAddress as `0x${string}`, abi: RAINDROP_ABI, functionName: 'name' }),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: RAINDROP_ABI, functionName: 'symbol' }),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: RAINDROP_ABI, functionName: 'vaultCreatorFee' }),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: RAINDROP_ABI, functionName: 'treasuryFee' }),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: RAINDROP_ABI, functionName: 'coin' }),
    ]).then(([
      name,
      symbol,
      creatorFee,
      treasuryFee,
      coinAddr
    ]) => {
      setVault({
        name: name as string,
        symbol: symbol as string,
        vaultCreatorFee: creatorFee as bigint,
        treasuryFee: treasuryFee as bigint,
      });
      setCoinAddress(coinAddr as `0x${string}`);
    }).catch((e) => {
      console.error(e);
      setError('Unable to load vault details');
    }).finally(() => {
      setLoadingDetails(false);
    });
  }, [vaultAddress]);

  // 2) Once we know the coin‐address and the user, load balances
  useEffect(() => {
    if (!coinAddress || !userAddress || !vaultAddress) return;

    const client = getPublicClient(config);
    Promise.all([
      // your token balance
      client.readContract({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [userAddress]
      }),
      // how many shares you hold
      client.readContract({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      }),
      // total staked in vault
      client.readContract({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress as `0x${string}`]
      }),
    ]).then(([coinBal, stakedBal, totStaked]) => {
      setBalances({
        coinBalance: formatUnits(coinBal as bigint, 18),
        stakedBalance: formatUnits(stakedBal as bigint, 18),
        totalStaked: formatUnits(totStaked as bigint, 18),
      });
    }).catch((e) => {
      console.error(e);
      // not fatal
    });
  }, [coinAddress, userAddress, vaultAddress]);

  // write‐hooks
  const { writeContract: approveWrite, data: approveHash } = useWriteContract();
  const { writeContract: stakeWrite, data: stakeHash } = useWriteContract();
  const { writeContract: unstakeWrite, data: unstakeHash } = useWriteContract();
  const { writeContract: dropWrite, data: dropHash } = useWriteContract();

  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isStaking }   = useWaitForTransactionReceipt({ hash: stakeHash });
  const { isLoading: isUnstaking } = useWaitForTransactionReceipt({ hash: unstakeHash });
  const { isLoading: isDropping }  = useWaitForTransactionReceipt({ hash: dropHash });

  // handlers all wrapped to catch revert
  const handleApprove = async () => {
    setError(null);
    if (!isConnected || !coinAddress) {
      return setError('Connect wallet');
    }
    if (!stakeAmt) {
      return setError('Enter an amount to approve');
    }

    try {
      await approveWrite({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'approve',
        args: [vaultAddress as `0x${string}`, parseEther(stakeAmt)]
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleStake = async () => {
    setError(null);
    if (!isConnected) {
      return setError('Connect wallet');
    }
    if (!stakeAmt) {
      return setError('Enter an amount to stake');
    }

    try {
      await stakeWrite({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'stake',
        args: [parseEther(stakeAmt)]
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleUnstake = async () => {
    setError(null);
    if (!isConnected) {
      return setError('Connect wallet');
    }
    if (!stakeAmt) {
      return setError('Enter an amount to unstake');
    }

    try {
      await unstakeWrite({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'unstake',
        args: [parseEther(stakeAmt)]
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleDrop = async () => {
    setError(null);
    if (!isConnected) {
      return setError('Connect wallet');
    }
    if (!dropAmt || !dropToken || !dropDeadline) {
      return setError('Fill all drop fields');
    }

    try {
      await dropWrite({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'drop',
        args: [BigInt(dropAmt), dropToken as `0x${string}`, BigInt(dropDeadline)]
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  if (loadingDetails) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0A192F] to-[#112240] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-300">
          Loading vault details…
        </div>
      </main>
    );
  }

  if (error && !vault) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0A192F] to-[#112240] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center text-red-500">
          {error}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative overflow-hidden p-4" style={{ background: '#1E1E1E' }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'}} />
      
      {/* Raindrop Animation */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* 4 green drops on the left, 4 blue drops on the right */}
        {[
          ...[...Array(4)].map(() => ({
            leftPercent: Math.random() * 49,
            color: 'green',
          })),
          ...[...Array(4)].map(() => ({
            leftPercent: 50 + Math.random() * 49,
            color: 'blue',
          })),
        ].map((drop, i) => {
          const left = `${drop.leftPercent}%`;
          const delay = `${Math.random() * 3}s`;
          const duration = `${3 + Math.random() * 2}s`;
          const dropClass = drop.color === 'green'
            ? "bg-gradient-to-b from-green-400 to-emerald-500"
            : "bg-gradient-to-b from-[#7ecbff] to-[#3673F5]";
          return (
            <div
              key={i}
              className="absolute top-0 animate-rain"
              style={{
                left,
                animationDelay: delay,
                animationDuration: duration,
              }}
            >
              <div className={`w-[2px] h-8 ${dropClass} rounded-full shadow-lg opacity-90`}></div>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-5xl mt-24 mb-12 z-10 space-y-8">
        {/* Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
            <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-8 py-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] rounded-xl blur-sm"></div>
                  <div className="relative bg-[#232c3b] p-2 rounded-xl">
                    <Coins className="text-emerald-400" size={24} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="font-futuristic text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] font-bold tracking-wider">
                    {vault?.name}
                  </h1>
                  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 animate-gradient-x"></div>
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl px-8 py-4">
                <p className="text-red-400 text-center font-futuristic">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vault Info */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
            <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 to-[#7ecbff]/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-[#232c3b] rounded-xl p-4">
                    <p className="text-sm text-[#7ecbff] mb-2 font-futuristic">Symbol</p>
                    <p className="text-lg font-semibold text-white font-futuristic">{vault?.symbol}</p>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-400/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-[#232c3b] rounded-xl p-4">
                    <p className="text-sm text-emerald-400 mb-2 font-futuristic">Creator Fee</p>
                    <p className="text-lg font-semibold text-white font-futuristic">{vault?.vaultCreatorFee.toString()} %</p>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 to-[#7ecbff]/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-[#232c3b] rounded-xl p-4">
                    <p className="text-sm text-[#7ecbff] mb-2 font-futuristic">Treasury Fee</p>
                    <p className="text-lg font-semibold text-white font-futuristic">{vault?.treasuryFee.toString()} %</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Approve */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-[#7ecbff] to-[#3673F5] animate-gradient-x"></div>
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#7ecbff] font-futuristic mb-6">Approve Tokens</h2>
                <div className="space-y-4">
                  <Input
                    type="number"
                    value={stakeAmt}
                    onChange={(e) => setStakeAmt(e.target.value)}
                    placeholder="Amount to approve"
                    className="bg-[#232c3b] border-[#3673F5] text-white h-12 font-futuristic"
                  />
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || !stakeAmt}
                    className="w-full h-12 bg-[#3673F5] text-white px-6 rounded-lg hover:bg-[#3673F5]/80 transition-colors font-futuristic font-bold shadow-neon"
                  >
                    {isApproving ? 'Approving…' : 'Approve Tokens'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stake / Unstake */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-400/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-gradient-x"></div>
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 font-futuristic mb-6">Stake / Unstake</h2>
                <div className="space-y-4">
                  <Input
                    type="number"
                    value={stakeAmt}
                    onChange={(e) => setStakeAmt(e.target.value)}
                    placeholder="Amount"
                    className="bg-[#232c3b] border-emerald-500 text-white h-12 font-futuristic"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleStake}
                      disabled={isStaking}
                      className="h-12 bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-lg hover:from-emerald-600 hover:to-green-500 transition-colors font-futuristic font-bold shadow-neon"
                    >
                      {isStaking ? 'Staking…' : 'Stake'}
                    </Button>
                    <Button
                      onClick={handleUnstake}
                      disabled={isUnstaking}
                      className="h-12 bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-lg hover:from-emerald-600 hover:to-green-500 transition-colors font-futuristic font-bold shadow-neon"
                    >
                      {isUnstaking ? 'Unstaking…' : 'Unstake'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drop */}
          <div className="relative group md:col-span-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#3673F5]/20 via-emerald-500/20 to-[#7ecbff]/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] font-futuristic mb-6">Drop Tokens</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    value={dropAmt}
                    onChange={(e) => setDropAmt(e.target.value)}
                    placeholder="Amount"
                    className="bg-[#232c3b] border-[#3673F5] text-white h-12 font-futuristic"
                  />
                  <Input
                    value={dropToken}
                    onChange={(e) => setDropToken(e.target.value)}
                    placeholder="Token address"
                    className="bg-[#232c3b] border-[#3673F5] text-white h-12 font-futuristic"
                  />
                  <Input
                    type="number"
                    value={dropDeadline}
                    onChange={(e) => setDropDeadline(e.target.value)}
                    placeholder="Deadline (unix)"
                    className="bg-[#232c3b] border-[#3673F5] text-white h-12 font-futuristic"
                  />
                </div>
                <Button
                  onClick={handleDrop}
                  disabled={isDropping}
                  className="w-full h-12 mt-4 bg-gradient-to-r from-[#3673F5] to-[#7ecbff] text-white rounded-lg hover:from-[#3673F5]/80 hover:to-[#7ecbff]/80 transition-colors font-futuristic font-bold shadow-neon"
                >
                  {isDropping ? 'Dropping…' : 'Drop Tokens'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
