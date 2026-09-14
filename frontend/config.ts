/**
 * RENZIE TRADE — Configuration File
 * 
 * Centralized on-chain configuration for Sepolia Testnet contracts and UI assets.
 * Values can be configured via environment variables (VITE_*) or default fallback values.
 */

export const CONFIG = {
  // Sepolia testnet chain ID (11155111)
  SEPOLIA_CHAIN_ID: 11155111,

  // Sepolia Public RPC endpoint (used for gas-free on-chain read operations)
  RPC_URL: (import.meta.env.VITE_SEPOLIA_RPC_URL as string) || "https://ethereum-sepolia-rpc.publicnode.com",

  // WalletConnect Project ID for RainbowKit (Reown Cloud). Optional for direct MetaMask injected connection.
  WALLETCONNECT_PROJECT_ID: (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || "c4f79cc821944d9680842e34466bfbd",

  // Deployed SimpleAMM Liquidity Pool contract address on Sepolia
  AMM_ADDRESS: ((import.meta.env.VITE_AMM_ADDRESS as string) || "0xe2418A85060977cBCD13E7ecc2e88E98A0428456") as `0x${string}`,

  // Token A: Renzie ETH (RZH)
  TOKEN_A: {
    name: "Renzie ETH",
    symbol: "RZH",
    address: ((import.meta.env.VITE_TOKEN_A_ADDRESS as string) || "0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd") as `0x${string}`,
    logo: "/renzie-icon.svg",
  },

  // Token B: ETHJKT Token (ETHJKT)
  TOKEN_B: {
    name: "ETHJKT Token",
    symbol: "ETHJKT",
    address: ((import.meta.env.VITE_TOKEN_B_ADDRESS as string) || "0x7E96fed902B0A26b62DA78e8112253920Fc55936") as `0x${string}`,
    logo: "/ethjkt-logo.png",
  },

  // UI Branding Assets
  BRAND_LOGO: "/renzie-icon.svg",
  TITLE_IMG: "/renzie-trade-logo.svg",
};

