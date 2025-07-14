// src/utils/rainbowConfig.ts
import {
    arbitrum,
    base,
    baseSepolia,      // ← newly added
    mainnet,
    optimism,
    polygon,
    scrollSepolia,
    sepolia,
  } from 'wagmi/chains'
  import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
  } from '@rainbow-me/rainbowkit'
  
  // Sanitize the project ID to avoid stray quotes/semicolons that break the WalletConnect API URL
  const walletConnectProjectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '').replace(/["';]/g, '').trim()
  
  export const config = getDefaultConfig({
    appName: 'Raindrop',
    projectId: walletConnectProjectId,
    chains: [
      scrollSepolia,
      baseSepolia,      // ← now supported
      polygon,
      mainnet,
    ],
    ssr: true,
  })
  