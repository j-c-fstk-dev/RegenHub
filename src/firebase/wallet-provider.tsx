'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, celo, gnosis, zora, polygonMumbai, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { ReactNode } from 'react';

// Setup supported chains
const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, celo, gnosis, zora, polygonMumbai, sepolia],
  [publicProvider()]
);

// Setup popular wallets with RainbowKit
const { connectors } = getDefaultWallets({
  appName: 'Regen Hub',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // IMPORTANT: Replace with your actual project ID from https://cloud.walletconnect.com
  chains,
});

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

// Create a provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider 
        chains={chains} 
        modalSize="wide" 
        theme={darkTheme({
            accentColor: '#386641', // Primary color
            accentColorForeground: '#F0F5F1',
            borderRadius: 'medium',
            fontStack: 'system',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
