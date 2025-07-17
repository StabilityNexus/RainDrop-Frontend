'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { parseEther, formatUnits, parseUnits } from 'viem';
import { format } from 'date-fns';

import { config } from '@/utils/config';
import { RAINDROP_ABI } from '@/utils/contractABI/Raindrop';
import { ERC20Abi } from '@/utils/contractABI/ERC20';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Coins, TrendingUp, Users, Shield, Calendar, Gift, Clock, CheckCircle, XCircle, Target, Sparkles } from 'lucide-react';

interface VaultDetailsState {
  name: string;
  symbol: string;
  vaultCreatorFee: bigint;
  treasuryFee: bigint;
}

interface Drop {
  id: number;
  token: `0x${string}`;
  amount: bigint;
  amountRemaining: bigint;
  balanceStaked: bigint;
  deadline: bigint;
  recoverer: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
  claimableAmount?: bigint;
  isEligibleToClaim?: boolean;
  hasUserClaimed?: boolean;
}

export default function VaultDetails() {
  const router = useRouter();
  const params = useParams<{ vault: string }>();
  const searchParams = useSearchParams();
  const vaultAddress = searchParams.get('vault');
  const { address: userAddress, isConnected } = useAccount();

  const [vault, setVault] = useState<VaultDetailsState | null>(null);
  const [coinAddress, setCoinAddress] = useState<`0x${string}` | null>(null);
  const [coinSymbol, setCoinSymbol] = useState<string>('');
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [vaultCreatorAddress, setVaultCreatorAddress] = useState<`0x${string}` | null>(null);

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [balances, setBalances] = useState({
    coinBalance: '0',
    stakedBalance: '0',
    totalStaked: '0',
  });

  const [stakeAmt, setStakeAmt] = useState('');
  const [unstakeAmt, setUnstakeAmt] = useState('');
  const [dropAmt, setDropAmt] = useState('');
  const [dropToken, setDropToken] = useState('');
  const [dropDate, setDropDate] = useState('');

  const [drops, setDrops] = useState<Drop[]>([]);
  const [loadingDrops, setLoadingDrops] = useState(false);
  const [userStakerCounterstamp, setUserStakerCounterstamp] = useState<number>(0);

  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      client.readContract({ address: vaultAddress as `0x${string}`, abi: RAINDROP_ABI, functionName: 'vaultCreator' }),
    ]).then(([name, symbol, creatorFee, treasuryFee, coinAddr, vaultCreator]) => {
      setVault({
        name: name as string,
        symbol: symbol as string,
        vaultCreatorFee: creatorFee as bigint,
        treasuryFee: treasuryFee as bigint,
      });
      setCoinAddress(coinAddr as `0x${string}`);
      setVaultCreatorAddress(vaultCreator as `0x${string}`);
    }).catch((e) => {
      console.error(e);
      setError('Unable to load vault details');
    }).finally(() => {
      setLoadingDetails(false);
    });
  }, [vaultAddress]);

  // 2) Once we know the coin-address and the user, load balances and token info
  useEffect(() => {
    if (!coinAddress || !userAddress || !vaultAddress) return;

    const client = getPublicClient(config);
    Promise.all([
      client.readContract({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      }),
      client.readContract({
        address: vaultAddress as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      }),
      client.readContract({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress as `0x${string}`],
      }),
      client.readContract({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'symbol',
      }),
      client.readContract({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'stakerCounterstamp',
        args: [userAddress],
      }),
    ]).then(([coinBal, stakedBal, totStaked, symbol, counterstamp]) => {
      setBalances({
        coinBalance: formatUnits(coinBal as bigint, 18),
        stakedBalance: formatUnits(stakedBal as bigint, 18),
        totalStaked: formatUnits(totStaked as bigint, 18),
      });
      setCoinSymbol(symbol as string);
      setUserStakerCounterstamp(Number(counterstamp));
      
      // Get total supply of vault tokens separately with error handling
      client.readContract({
        address: vaultAddress as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'totalSupply',
      }).then((supply) => {
        setTotalSupply(formatUnits(supply as bigint, 18));
      }).catch((err) => {
        console.error('Error fetching total supply:', err);
        setTotalSupply('0');
      });
    }).catch((e) => {
      console.error(e);
    });
  }, [coinAddress, userAddress, vaultAddress]);

  // write hooks
  const { writeContract: stakeWrite, data: stakeHash } = useWriteContract();
  const { writeContract: unstakeWrite, data: unstakeHash } = useWriteContract();
  const { writeContract: dropWrite, data: dropHash } = useWriteContract();
  const { writeContract: claimWrite, data: claimHash } = useWriteContract();
  const { writeContract: recoverWrite, data: recoverHash } = useWriteContract();
  const { writeContract: approveWrite, data: approveHash } = useWriteContract();

  const { isLoading: isStaking } = useWaitForTransactionReceipt({ hash: stakeHash });
  const { isLoading: isUnstaking } = useWaitForTransactionReceipt({ hash: unstakeHash });
  const { isLoading: isDropping } = useWaitForTransactionReceipt({ hash: dropHash });
  const { isLoading: isClaiming } = useWaitForTransactionReceipt({ hash: claimHash });
  const { isLoading: isRecovering } = useWaitForTransactionReceipt({ hash: recoverHash });
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });

  // Utility functions

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatTokenAmount = (amount: bigint, decimals: number) => {
    const formatted = formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // Improved handlers with integrated approve
  const handleStake = async () => {
    setError(null);
    if (!isConnected || !coinAddress) {
      return setError('Connect wallet');
    }
    if (!stakeAmt) {
      return setError('Enter an amount to stake');
    }

    try {
      // First approve the tokens
      await approveWrite({
        address: coinAddress,
        abi: ERC20Abi,
        functionName: 'approve',
        args: [vaultAddress as `0x${string}`, parseEther(stakeAmt)],
      });

      // Wait a bit for approval to process, then stake
      setTimeout(async () => {
        await stakeWrite({
          address: vaultAddress as `0x${string}`,
          abi: RAINDROP_ABI,
          functionName: 'stake',
          args: [parseEther(stakeAmt)],
        });
      }, 2000);
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
    if (!unstakeAmt) {
      return setError('Enter an amount to unstake');
    }

    try {
      await unstakeWrite({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'unstake',
        args: [parseEther(unstakeAmt)],
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
    if (!dropAmt || !dropToken || !dropDate) {
      return setError('Fill all drop fields');
    }

    try {
      const selected = new Date(dropDate + 'T00:00:00');
      const deadlineUnix = Math.floor(selected.getTime() / 1000);
      if (deadlineUnix < Math.floor(Date.now() / 1000)) {
        return setError('Selected date must be in the future');
      }

      // Get token decimals first
      const client = getPublicClient(config);
      let tokenDecimals = 18; // default to 18 decimals
      
      try {
        const decimals = await client.readContract({
          address: dropToken as `0x${string}`,
          abi: ERC20Abi,
          functionName: 'decimals',
        });
        tokenDecimals = Number(decimals);
      } catch (err) {
        console.error('Error fetching token decimals, using default 18:', err);
      }

      // Convert drop amount to proper format with correct decimals
      const dropAmountWei = parseUnits(dropAmt, tokenDecimals);

      // First approve the drop tokens
      await approveWrite({
        address: dropToken as `0x${string}`,
        abi: ERC20Abi,
        functionName: 'approve',
        args: [vaultAddress as `0x${string}`, dropAmountWei],
      });

      // Wait a bit for approval to process, then drop
      setTimeout(async () => {
        await dropWrite({
          address: vaultAddress as `0x${string}`,
          abi: RAINDROP_ABI,
          functionName: 'drop',
          args: [dropAmountWei, dropToken as `0x${string}`, BigInt(deadlineUnix)],
        });
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleClaim = async (dropId: number) => {
    setError(null);

    try {
      await claimWrite({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'claim',
        args: [BigInt(dropId)],
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRecover = async (dropId: number) => {
    setError(null);
    try {
      await recoverWrite({
        address: vaultAddress as `0x${string}`,
        abi: RAINDROP_ABI,
        functionName: 'recover',
        args: [BigInt(dropId)],
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (!vaultAddress || !userAddress) return;
    const client = getPublicClient(config);

    async function fetchDrops() {
      setLoadingDrops(true);
      try {
        const dropCounter = await client.readContract({
          address: vaultAddress as `0x${string}`,
          abi: RAINDROP_ABI,
          functionName: 'dropCounter',
        });
        const dropCount = Number(dropCounter);

        const dropPromises = [];
        for (let i = 0; i < dropCount; i++) {
          dropPromises.push(
            (async () => {
              try {
                // Get drop data, claimable amount, and hasClaimed status from contract
                const [dropRaw, claimableAmount, hasUserClaimed] = await Promise.all([
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: RAINDROP_ABI,
                    functionName: 'drops',
                    args: [BigInt(i)],
                  }),
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: RAINDROP_ABI,
                    functionName: 'claimable',
                    args: [BigInt(i), userAddress as `0x${string}`],
                  }),
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: RAINDROP_ABI,
                    functionName: 'hasClaimed',
                    args: [BigInt(i), userAddress as `0x${string}`],
                  }),
                ]);

                const [
                  token,
                  amount,
                  amountRemaining,
                  balanceStaked,
                  deadline,
                  recoverer,
                ] = dropRaw as [
                  `0x${string}`,
                  bigint,
                  bigint,
                  bigint,
                  bigint,
                  `0x${string}`
                ];

                // Fetch token symbol and decimals
                let tokenSymbol = '';
                let tokenDecimals = 18;
                try {
                  const [symbol, decimals] = await Promise.all([
                    client.readContract({
                      address: token,
                      abi: ERC20Abi,
                      functionName: 'symbol',
                    }),
                    client.readContract({
                      address: token,
                      abi: ERC20Abi,
                      functionName: 'decimals',
                    }),
                  ]);
                  tokenSymbol = symbol as string;
                  tokenDecimals = Number(decimals);
                } catch (err) {
                  console.error('Error fetching token info for', token, err);
                  tokenSymbol = `${token.slice(0, 6)}...${token.slice(-4)}`;
                }

                // Determine eligibility based on claimable amount and claim status
                const claimableAmountBigInt = claimableAmount as bigint;
                const hasClaimedBool = hasUserClaimed as boolean;
                const isEligible = claimableAmountBigInt > 0n && !hasClaimedBool;

                return {
                  id: i,
                  token,
                  amount,
                  amountRemaining,
                  balanceStaked,
                  deadline,
                  recoverer,
                  tokenSymbol,
                  tokenDecimals,
                  claimableAmount: claimableAmountBigInt,
                  isEligibleToClaim: isEligible,
                  hasUserClaimed: hasClaimedBool,
                };
              } catch (err) {
                console.error('Error fetching drop', i, err);
                return null;
              }
            })()
          );
        }
        const dropsData = await Promise.all(dropPromises);
        const validDrops = dropsData.filter(drop => drop !== null) as Drop[];
        setDrops(validDrops);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDrops(false);
      }
    }

    fetchDrops();
  }, [vaultAddress, userAddress, userStakerCounterstamp, balances.stakedBalance, claimHash, recoverHash, dropHash]);

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
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)' }} />

      {/* Raindrop Animation */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {[
          ...[...Array(3)].map(() => ({
            leftPercent: Math.random() * 49,
            color: 'green',
          })),
          ...[...Array(3)].map(() => ({
            leftPercent: 50 + Math.random() * 49,
            color: 'blue',
          }))
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
              <div className={`w-[2px] h-8 ${dropClass} rounded-full shadow-lg opacity-40`}></div>
            </div>
          );
        })}
      </div>

      <div className="w-full mt-24 mb-12 z-10 space-y-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        {/* Header */}
        <div className="relative flex justify-center items-start">
          {/* Vault Title - Centered */}
          <div className="text-center">
            <h1 className="font-futuristic text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2">
              {vault?.name}
            </h1>
            <div className="relative mx-auto w-32 h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
            </div>
          </div>
          
          {/* Token Balances - Absolute positioned to top right */}
          {isConnected && (
            <div className="absolute top-0 right-0 flex gap-3">
              {/* Coin Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 px-3 py-2 min-w-[100px] hover:bg-white/15 transition-all">
                <div className="text-xs text-gray-300 font-futuristic font-medium mb-1">{coinSymbol} balance</div>
                <div className="text-sm font-bold text-white font-futuristic">{formatBalance(balances.coinBalance)}</div>
              </div>
              
              {/* Staked Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 px-3 py-2 min-w-[100px] hover:bg-white/15 transition-all">
                <div className="text-xs text-gray-300 font-futuristic font-medium mb-1">{vault?.symbol} balance</div>
                <div className="text-sm font-bold text-white font-futuristic">{formatBalance(balances.stakedBalance)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
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
        )}

        {/* Vault Info */}
        <div className="flex justify-center">
          <div className="relative group max-w-6xl w-full">
            <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden border-2 border-emerald-500">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-emerald-500 to-[#7ecbff] animate-gradient-x"></div>
              <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="relative group">
                    <div className="relative bg-[#232c3b] rounded-xl p-6 text-center border-2 border-blue-500/50 group-hover:border-blue-400">
                      <p className="text-sm text-[#7ecbff] mb-3 font-futuristic font-bold">Total Value Locked</p>
                      <p className="text-2xl font-semibold text-white font-futuristic">
                        {formatBalance(balances.totalStaked)} {coinSymbol}
                      </p>
                    </div>
                  </div>
                                    <div className="relative group">
                    <div className="relative bg-[#232c3b] rounded-xl p-6 text-center border-2 border-emerald-500/50 group-hover:border-emerald-400">
                      <p className="text-sm text-emerald-400 mb-3 font-futuristic font-bold">Total Supply</p>
                      <p className="text-2xl font-semibold text-white font-futuristic">
                        {parseFloat(totalSupply) === 0 ? '0' : `${formatBalance(totalSupply)} ${vault?.symbol}`}
                      </p>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="relative bg-[#232c3b] rounded-xl p-6 text-center border-2 border-purple-500/50 group-hover:border-purple-400">
                      <p className="text-sm text-purple-400 mb-3 font-futuristic font-bold">Creator Fee</p>
                      <p className="text-2xl font-semibold text-white font-futuristic">
                        {vault?.vaultCreatorFee ? (Number(vault.vaultCreatorFee) / 1000).toFixed(2) : '0'}%
                      </p>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="relative bg-[#232c3b] rounded-xl p-6 text-center border-2 border-[#3673F5]/50 group-hover:border-[#3673F5]">
                      <p className="text-sm text-[#3673F5] mb-3 font-futuristic font-bold">Treasury Fee</p>
                      <p className="text-2xl font-semibold text-white font-futuristic">
                        {vault?.treasuryFee ? (Number(vault.treasuryFee) / 1000).toFixed(2) : '0'}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center space-y-6">
          {/* Stake and Unstake Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
            {/* Stake */}
            <div className="relative group">
              <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden border-2 border-emerald-500">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-gradient-x"></div>
                <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <TrendingUp className="text-emerald-400" size={24} />
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 font-futuristic">Stake</h2>
                  </div>
                  <div className="space-y-4">
                    <Input
                      type="number"
                      value={stakeAmt}
                      onChange={(e) => setStakeAmt(e.target.value)}
                      placeholder="Amount to stake"
                      className="bg-[#232c3b] border-2 border-emerald-500 text-white h-12 font-futuristic"
                    />
                    <Button
                      onClick={handleStake}
                      disabled={isStaking || isApproving || !stakeAmt}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-lg hover:from-emerald-600 hover:to-green-500 transition-colors font-futuristic font-bold border-2 border-emerald-400 shadow-lg"
                    >
                      {isApproving ? 'Approving…' : isStaking ? 'Staking…' : 'Stake Tokens'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Unstake */}
            <div className="relative group">
              <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden border-2 border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-r from-[#3673F5] via-[#7ecbff] to-[#3673F5] animate-gradient-x"></div>
                <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Users className="text-[#7ecbff]" size={24} />
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#7ecbff] font-futuristic">Unstake</h2>
                  </div>
                  <div className="space-y-4">
                    <Input
                      type="number"
                      value={unstakeAmt}
                      onChange={(e) => setUnstakeAmt(e.target.value)}
                      placeholder="Amount to unstake"
                      className="bg-[#232c3b] border-2 border-[#3673F5] text-white h-12 font-futuristic"
                    />
                    <Button
                      onClick={handleUnstake}
                      disabled={isUnstaking || !unstakeAmt}
                      className="w-full h-12 bg-gradient-to-r from-[#3673F5] to-[#7ecbff] text-white rounded-lg hover:from-[#3673F5]/80 hover:to-[#7ecbff]/80 transition-colors font-futuristic font-bold border-2 border-blue-400 shadow-lg"
                    >
                      {isUnstaking ? 'Unstaking…' : 'Unstake Tokens'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drop Tokens */}
          <div className="w-full max-w-6xl">
            <div className="relative group">
              <div className="relative bg-[#232c3b] rounded-2xl overflow-hidden border-2 border-purple-500">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 animate-gradient-x"></div>
                <div className="relative bg-[#232c3b] m-[2px] rounded-2xl p-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Gift className="text-purple-400" size={24} />
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400 font-futuristic">Drop Tokens</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-400 mb-2 font-futuristic">
                          Amount
                        </label>
                        <Input
                          type="number"
                          value={dropAmt}
                          onChange={(e) => setDropAmt(e.target.value)}
                          placeholder="Amount"
                          className="bg-[#232c3b] border-2 border-purple-500 text-white h-12 font-futuristic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-400 mb-2 font-futuristic">
                          Token Address
                        </label>
                        <Input
                          value={dropToken}
                          onChange={(e) => setDropToken(e.target.value)}
                          placeholder="Token address"
                          className="bg-[#232c3b] border-2 border-purple-500 text-white h-12 font-futuristic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-400 mb-2 font-futuristic">
                          Deadline
                        </label>
                        <Input
                          type="date"
                          value={dropDate}
                          onChange={(e) => setDropDate(e.target.value)}
                          className="bg-[#232c3b] border-2 border-purple-500 text-white h-12 font-futuristic"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleDrop}
                      disabled={isDropping || isApproving}
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-lg hover:from-purple-600 hover:to-pink-500 transition-colors font-futuristic font-bold border-2 border-purple-400 shadow-lg"
                    >
                      {isApproving ? 'Approving…' : isDropping ? 'Dropping…' : 'Drop Tokens'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drops Timeline */}
      <div className="w-full max-w-6xl mx-auto z-10 mb-12">
        <div className="relative group mb-8">
             <h2 className="font-futuristic text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 font-bold tracking-wider mb-2 text-center">
                Vault Drops
              </h2>
              <div className="relative mx-auto w-24 h-1">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full blur-sm opacity-50"></div>
              </div>
          </div>

        {loadingDrops ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="relative bg-[#232c3b] rounded-2xl px-12 py-8 border-2 border-emerald-500/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                <p className="text-gray-300 font-futuristic font-bold">Loading drops...</p>
              </div>
            </div>
          </div>
        ) : drops.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#3673F5]/30 via-emerald-500/30 to-[#7ecbff]/30 rounded-2xl"></div>
              <div className="relative bg-[#232c3b] rounded-2xl px-12 py-12 border-2 border-emerald-500/50">
                <div className="mb-6">
                  <div className="relative inline-block">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center border-2 border-purple-400">
                      <Gift className="text-white" size={32} />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white font-futuristic mb-4">No Drops Yet</h3>
                <p className="text-gray-300 font-futuristic">Create your first token drop to reward stakers!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drops.map((drop) => {
              const now = Math.floor(Date.now() / 1000);
              const isExpired = now > Number(drop.deadline);
              const isOwner = userAddress?.toLowerCase() === drop.recoverer.toLowerCase();
              const progressPercentage = ((Number(drop.amount) - Number(drop.amountRemaining)) / Number(drop.amount)) * 100;
              
              return (
                <div
                  key={drop.id}
                  className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  onClick={() => { setSelectedDrop(drop); setModalOpen(true); }}
                >
                  {/* Background glow to match VaultCard */}
                  <div className="absolute -inset-0.5 bg-white opacity-5 blur rounded-xl group-hover:opacity-10 transition duration-300"></div>

                  {/* Card content styled like VaultCard */}
                  <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-hover:shadow-[0_16px_32px_rgba(255,255,255,0.1)] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="font-futuristic text-lg text-white">Drop {drop.id + 1}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-futuristic ${
                        isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Claimed</span>
                        <span>{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            isExpired ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-emerald-500 to-green-400'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-[#7ecbff]">
                        Token: <span className="text-white font-bold">{drop.tokenSymbol}</span>
                      </div>
                      <div className="text-sm text-[#7ecbff]">
                        Amount: <span className="text-white">{formatTokenAmount(drop.amount, drop.tokenDecimals)} {drop.tokenSymbol}</span>
                      </div>
                      <div className="text-sm text-[#7ecbff]">
                        Remaining: <span className="text-white">{formatTokenAmount(drop.amountRemaining, drop.tokenDecimals)} {drop.tokenSymbol}</span>
                      </div>
                      <div className="text-sm text-[#7ecbff] flex items-center gap-2">
                        <Calendar size={14} />
                        <span className="text-white">{format(new Date(Number(drop.deadline) * 1000), 'PPP')}</span>
                      </div>
                      
                      {/* Eligibility Status */}
                      {!isExpired && drop.claimableAmount !== undefined && drop.claimableAmount > 0n && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          {drop.isEligibleToClaim && !drop.hasUserClaimed ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                              <CheckCircle size={14} />
                              <span>Claimable: {formatTokenAmount(drop.claimableAmount, drop.tokenDecimals)} {drop.tokenSymbol}</span>
                            </div>
                          ) : drop.hasUserClaimed ? (
                            <div className="flex items-center gap-2 text-blue-400 text-sm">
                              <CheckCircle size={14} />
                              <span>Already Claimed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <XCircle size={14} />
                              <span>Not Eligible</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Recover Option for Owner */}
                      {isExpired && isOwner && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <Target size={14} />
                            <span>Recovery Available</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drop Modal */}
      {modalOpen && selectedDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative group max-w-md w-full mx-4">
            {/* Background glow to match VaultCard */}
            <div className="absolute -inset-0.5 bg-white opacity-5 blur rounded-xl group-hover:opacity-10 transition duration-300"></div>
            
            {/* Modal content styled like VaultCard */}
            <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-800 p-8 shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-hover:shadow-[0_16px_32px_rgba(255,255,255,0.1)] transition-all duration-300">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
              onClick={() => setModalOpen(false)}
            >✕</button>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="text-purple-400" size={24} />
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7ecbff] via-emerald-400 to-[#3673F5] font-futuristic">
                  Drop {selectedDrop.id + 1}
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-[#1a2332] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Token</div>
                  <div className="text-sm text-white font-bold">{selectedDrop.tokenSymbol}</div>
                  <div className="text-xs text-gray-400 font-mono mt-1">{selectedDrop.token}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1a2332] rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                    <div className="text-sm text-white">{formatTokenAmount(selectedDrop.amount, selectedDrop.tokenDecimals)} {selectedDrop.tokenSymbol}</div>
                  </div>
                  <div className="bg-[#1a2332] rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Remaining</div>
                    <div className="text-sm text-white">{formatTokenAmount(selectedDrop.amountRemaining, selectedDrop.tokenDecimals)} {selectedDrop.tokenSymbol}</div>
                  </div>
                </div>
                {selectedDrop.claimableAmount !== undefined && selectedDrop.claimableAmount > 0n && (
                  <div className="bg-gradient-to-r from-emerald-500/20 to-green-400/20 rounded-lg p-3 border border-emerald-500/30">
                    <div className="text-xs text-emerald-400 mb-1">Your Claimable Amount</div>
                    <div className="text-lg font-bold text-white">{formatTokenAmount(selectedDrop.claimableAmount, selectedDrop.tokenDecimals)} {selectedDrop.tokenSymbol}</div>
                  </div>
                )}
                <div className="bg-[#1a2332] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Deadline</div>
                  <div className="text-sm text-white">{format(new Date(Number(selectedDrop.deadline) * 1000), 'PPPpp')}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(() => {
              const now = Math.floor(Date.now() / 1000);
              const isExpired = now > Number(selectedDrop.deadline);
              const isOwner = userAddress?.toLowerCase() === selectedDrop.recoverer.toLowerCase();
              const isVaultCreator = userAddress?.toLowerCase() === vaultCreatorAddress?.toLowerCase();
              const canClaim = selectedDrop.isEligibleToClaim;
              const hasStakedBalance = parseFloat(balances.stakedBalance) > 0;
              
              if (isExpired && isOwner) {
                return (
                  <Button
                    onClick={() => handleRecover(selectedDrop.id)}
                    disabled={isRecovering}
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg font-futuristic font-bold shadow-lg border-2 border-red-400 flex items-center justify-center gap-2"
                  >
                    {isRecovering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Recovering…
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Recover Tokens
                      </>
                    )}
                  </Button>
                );
              } else if (!isExpired && (canClaim || (isVaultCreator && hasStakedBalance && !selectedDrop.hasUserClaimed))) {
                const isDisabled = !canClaim || isClaiming || selectedDrop.hasUserClaimed;
                
                return (
                  <Button
                    onClick={() => handleClaim(selectedDrop.id)}
                    disabled={isDisabled}
                    className={`w-full h-12 ${
                      isDisabled 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-green-400 text-white'
                    } rounded-lg font-futuristic font-bold shadow-lg border-2 ${
                      isDisabled ? 'border-gray-500' : 'border-emerald-400'
                    } flex items-center justify-center gap-2`}
                  >
                    {isClaiming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Claiming…
                      </>
                    ) : selectedDrop.hasUserClaimed ? (
                      <>
                        <CheckCircle size={18} />
                        Already Claimed
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Claim Tokens
                      </>
                    )}
                  </Button>
                );
              } else {
                let message = '';
                if (isExpired) {
                  message = 'Only the drop creator can recover after deadline.';
                } else if (!hasStakedBalance) {
                  message = 'You must stake tokens to claim drops.';
                } else if (selectedDrop.hasUserClaimed) {
                  message = 'You have already claimed this drop.';
                } else if (userStakerCounterstamp > selectedDrop.id) {
                  message = 'You staked after this drop was created.';
                } else if (selectedDrop.claimableAmount === 0n) {
                  message = 'No tokens available to claim.';
                } else {
                  message = 'You are not eligible to claim this drop.';
                }
                
                return (
                  <div className="text-center text-gray-400 font-futuristic bg-[#1a2332] rounded-lg p-4">
                    <Clock className="mx-auto mb-2" size={20} />
                    {message}
                  </div>
                );
              }
            })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
