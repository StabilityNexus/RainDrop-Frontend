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
    Chain,
  } from 'wagmi/chains'
  import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
  } from '@rainbow-me/rainbowkit'
  
  export const config = getDefaultConfig({
    appName: 'Raindrop',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? '',
    chains: [
      scrollSepolia,
      baseSepolia,      // ← now supported
      polygon,
      mainnet,
    ],
    ssr: true,
  })
  