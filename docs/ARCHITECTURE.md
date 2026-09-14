# 🏛️ Sistem Arsitektur — RENZIE TRADE

Dokumen ini menjelaskan arsitektur teknis dari platform **RENZIE TRADE (Smart Swap Token & AMM DEX)**, mulai dari lapisan smart contract on-chain hingga lapisan frontend Web3 dApp.

---

## 📐 Diagram Arsitektur Tingkat Tinggi

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|   +-----------------------------------------------------------------+   |
|   |                       Web3 Wallet (MetaMask)                    |   |
|   |          (Injected Provider / Non-Custodial Key Signer)          |   |
|   +--------------------------------+--------------------------------+   |
+------------------------------------|------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                         FRONTEND DAPP (Vite + React)                    |
|                                                                         |
|   +----------------------+   +------------------+   +---------------+   |
|   |      Swap View       |   |  Liquidity View  |   |  Oracle View  |   |
|   | (Approve & Exchange) |   |  (Add / Remove)  |   | (Chart & Log) |   |
|   +----------------------+   +------------------+   +---------------+   |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                 Wagmi Hooks & Viem Client Layer                 |   |
|   |     (useReadContracts, useAccount, writeContract, getLogs)      |   |
|   +-----------------------------------------------------------------+   |
+------------------------------------+------------------------------------+
                                     | JSON-RPC (HTTPS / WSS)
                                     v
+------------------------------------+------------------------------------+
|                    ETHEREUM SEPOLIA TESTNET (EVM)                       |
|                                                                         |
|   +-------------------+                     +-----------------------+   |
|   |  SimpleAMM.sol    |<------------------->|  Renzie.sol (RZH)     |   |
|   |  (Pool Contract)  |   ERC-20 Interface  |  (ERC-20 Token A)     |   |
|   |                   |                     +-----------------------+   |
|   |                   |                     +-----------------------+   |
|   |   x * y = k       |<------------------->|  EthjktToken.sol      |   |
|   |   Fee 0.3%        |                     |  (ERC-20 Token B)     |   |
|   +-------------------+                     +-----------------------+   |
+-------------------------------------------------------------------------+
```

---

## 🧩 Komponen Sistem

### 1. Smart Contract Layer (Solidity ^0.8.20)

- **`Renzie.sol` (Token A - `RZH`)**:
  - Standar ERC-20 OpenZeppelin dengan 18 desimal.
  - Alamat: `0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd`.
  - Pasokan awal: 1.000.000 RZH ke deployer.
  - Memiliki fungsi `mint(uint256)` sebagai faucet terbuka untuk pengujian likuiditas di Sepolia.

- **`EthjktToken.sol` (Token B - `ETHJKT`)**:
  - Standar ERC-20 OpenZeppelin dengan 18 desimal.
  - Alamat: `0x7E96fed902B0A26b62DA78e8112253920Fc55936`.
  - Token pasangan (quote currency) di dalam pool DEX.

- **`SimpleAMM.sol` (Automated Market Maker Pool)**:
  - Alamat: `0xe2418A85060977cBCD13E7ecc2e88E98A0428456`.
  - Mengimplementasikan rumus produk konstan $x \times y = k$.
  - Menerapkan fee protokol/likuiditas sebesar 0.3% (`FEE_NUM = 997`, `FEE_DEN = 1000`).
  - Mengelola LP Shares untuk melacak kepemilikan proporsional penyedia likuiditas.
  - Memancarkan event `Swapped`, `LiquidityAdded`, dan `LiquidityRemoved`.

---

### 2. Frontend Layer (React 18 + TypeScript + Vite)

- **UI Framework & Styling**:
  - React 18 dengan arsitektur komponen terisolasi.
  - Desain *Liquid Glassmorphism* (`styles.css`) dengan aksen neon cyber-dApp, mendukung Dark & Light Mode.
- **Web3 Connector**:
  - **RainbowKit + Wagmi v2 + Viem**:
    - Koneksi dompet modular (MetaMask, WalletConnect, Coinbase Wallet).
    - Mekanisme *Fallback Transport*: mencoba RPC publik utama, lalu beralih otomatis ke RPC cadangan jika terjadi rate-limiting atau latensi tinggi.
    - Pembacaan data on-chain secara independen tanpa mewajibkan dompet terhubung terlebih dahulu (`ssr: false`, `query: { refetchInterval: 10000 }`).
- **Fitur Modular**:
  - `Swap`: Kalkulasi instan token masuk vs token keluar dengan rumus `getAmountOut()`, proteksi allowance dengan proses 2 tahap (*Approve* lalu *Swap*).
  - `Liquidity`: Sinkronisasi rasio token otomatis saat menyetor likuiditas ke pool yang sudah aktif, serta kalkulasi pembakaran shares saat menarik likuiditas.
  - `Oracle`: Pelacakan log event `Swapped` historis, metrik volume trading token A vs token B, champion token, serta chart SVG interaktif perbandingan harga pool vs oracle referensi.
  - `History`: Penyimpanan riwayat transaksi lokal via `localStorage` yang terhubung langsung ke Etherscan Explorer Sepolia.
