# ⚡ RENZIE TRADE — Smart Swap Token & AMM DEX

<p align="center">
  <img src="frontend/public/renzie-trade-logo.svg" alt="RENZIE TRADE Logo" width="550" />
</p>

<p align="center">
  <b>Decentralized Exchange (DEX) berbasis Automated Market Maker (AMM) Constant Product Formula ($x \times y = k$) di jaringan Ethereum Sepolia Testnet.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Network-Sepolia%20Testnet-627EEA?logo=ethereum" alt="Sepolia" />
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript%20%2B%20Vite-61DAFB?logo=react" alt="React Vite" />
  <img src="https://img.shields.io/badge/Web3-Wagmi%20%2B%20Viem%20%2B%20RainbowKit-38BDF8" alt="Wagmi" />
  <img src="https://img.shields.io/badge/Security-Zero--Leak%20Policy-10B981" alt="Zero-Leak Policy" />
</p>

---

## 📌 Sekilas Proyek

**RENZIE TRADE** adalah dApp bursa terdesentralisasi (DEX) mandiri berstandar Web3 modern. Platform ini mengizinkan pengguna untuk menukar token ERC-20 secara *permissionless* tanpa perantara, mengelola kolam likuiditas (*Liquidity Pool*), serta menganalisis dinamika pasar melalui modul **On-Chain Oracle & Event Analytics**.

### 🪙 Identitas Token & Kontrak Terdeploy (Sepolia Testnet)

| Kontrak | Nama & Simbol | Alamat Kontrak (Sepolia) | Etherscan Explorer |
| :--- | :--- | :--- | :--- |
| **Token A** | Renzie ETH (`RZH`) | `0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd` | [Lihat di Etherscan](https://sepolia.etherscan.io/address/0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd) |
| **Token B** | ETHJKT Token (`ETHJKT`) | `0x7E96fed902B0A26b62DA78e8112253920Fc55936` | [Lihat di Etherscan](https://sepolia.etherscan.io/address/0x7E96fed902B0A26b62DA78e8112253920Fc55936) |
| **AMM Pool** | SimpleAMM (Pasar DEX) | `0xe2418A85060977cBCD13E7ecc2e88E98A0428456` | [Lihat di Etherscan](https://sepolia.etherscan.io/address/0xe2418A85060977cBCD13E7ecc2e88E98A0428456) |

* **Deploy TxHash:** [`0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8`](https://sepolia.etherscan.io/tx/0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8)

---

## 🏗️ Struktur Repositori Bersih (Standard Web3)

```text
smart-swap-token/
├── contracts/                  # Smart Contracts Solidity (^0.8.20)
│   ├── SimpleAMM.sol           # Mesin AMM Constant Product (x * y = k) & fee 0.3%
│   ├── Renzie.sol              # Kontrak ERC-20 Token Renzie ETH (RZH)
│   └── EthjktToken.sol         # Kontrak ERC-20 Token Pasangan (ETHJKT)
├── frontend/                   # Web3 dApp Modern (React 18 + TS + Vite + Wagmi)
│   ├── public/                 # Aset grafis 4K, logo SVG, dan background
│   ├── src/
│   │   ├── App.tsx             # Kontroler UI swap, likuiditas, riwayat transaksi
│   │   ├── Oracle.tsx          # Komponen On-Chain Event Tracker & Chart Oracle
│   │   ├── abi.ts              # Deklarasi antarmuka ABI Smart Contract
│   │   ├── wagmi.ts            # Konfigurasi konektor RainbowKit, Wagmi, & Viem
│   │   ├── styles.css          # Desain antarmuka Liquid Glassmorphism
│   │   └── main.tsx            # Root entry point React
│   ├── config.ts               # Konfigurasi on-chain & environment variables
│   ├── .env.example            # Template environment aman untuk frontend
│   ├── package.json            # Dependensi dApp Web3
│   ├── tsconfig.json           # Konfigurasi TypeScript strict
│   └── vite.config.ts          # Konfigurasi bundler Vite
├── docs/                       # Dokumentasi Teknis & Spesifikasi Lengkap
│   ├── ARCHITECTURE.md         # Arsitektur sistem on-chain & frontend Web3
│   ├── AMM_SPECIFICATION.md    # Penurunan matematis rumus x * y = k & formula fee
│   ├── AI_ORACLE_SPEC.md       # Spesifikasi modul Oracle, getLogs, & prompt advisor
│   └── SECURITY.md             # Protokol Zero-Leak & audit keamanan smart contract
├── .env.example                # Template environment variabel aman di root
├── .gitignore                  # Filter ketat pencegahan kebocoran data
└── README.md                   # Panduan dokumentasi utama
```

---

## 🌟 Fitur Utama & Penjelasan Teknis

### 1. Pertukaran Token Instan (AMM Token Swap)
- **Mekanisme Otomatis**: Pertukaran aset `RZH` $\leftrightarrow$ `ETHJKT` menggunakan rumus Constant Product Invariant $x \times y = k$.
- **Preview On-Chain**: Fungsi `getAmountOut()` menghitung secara instan jumlah token yang akan diterima sebelum pengguna menandatangani transaksi.
- **Dua Tahap Transaksi (Approve $\rightarrow$ Swap)**: Menerapkan standar keamanan ERC-20 di mana pengguna memberikan izin penarikan sejumlah token terlebih dahulu, kemudian melakukan eksekusi swap pada blok berikutnya.

### 2. Pengelolaan Kolam Likuiditas (Liquidity Pool)
- **Add Liquidity**: Pengguna dapat menyetor kedua token ke dalam pool. Sistem secara otomatis menghitung rasio pasangan token yang seimbang berdasarkan harga cadangan pool saat ini.
- **LP Shares (Kepemilikan Pool)**: Penyetor likuiditas memperoleh token LP Shares sebagai bukti hak kepemilikan dan berhak menerima pembagian fee trading **0.3%** dari setiap aktivitas swap.
- **Remove Liquidity**: Penarikan modal token beserta akumulasi keuntungan fee secara instan dengan membakar (*burn*) sejumlah LP shares.

### 3. Modul On-Chain Oracle & Event Analytics
- **Live Event Scraping**: Mengambil log on-chain `event Swapped` secara langsung dari RPC Sepolia menggunakan metode `eth_getLogs` (jendela pemindaian 3.000 hingga 200.000 blok).
- **Volume & Champion Token**: Menghitung akumulasi volume trading dan menyematkan lencana 👑 **Paling Aktif** pada token yang memiliki aliran volume terbesar.
- **Chart Harga Pool vs Reference Oracle**: Menampilkan perbandingan grafik harga pasar on-chain terhadap feed harga referensi serta menghitung persentase deviasi untuk mendeteksi peluang arbitrase.

### 4. Riwayat Transaksi Real-Time & Etherscan Explorer
- Log aktivitas transaksi disimpan secara lokal di browser (`localStorage`).
- Setiap transaksi (Swap, Tambah Likuiditas, Tarik Likuiditas) dilengkapi tautan langsung ke **Sepolia Etherscan Explorer** untuk verifikasi status bukti on-chain.

### 5. Antarmuka Liquid Glassmorphism & Multi-Theme
- Desain antarmuka modern bernuansa *Liquid Glass* dengan animasi dinamis.
- Mendukung pengalihan tema **Dark Mode** dan **Light Mode** secara mulus.

---

## 🛡️ Kebijakan Keamanan & Pencegahan Kebocoran Data (Zero-Leak)

> [!IMPORTANT]
> **ATURAN MUTLAK REPOSITORI:**
> 1. **DILARANG MENG-COMMIT PRIVATE KEY ATAU SEED PHRASE.**
> 2. Seluruh file environment `.env`, `.env.*`, `*.key`, `*.pem`, dan file dompet `wallet.json` / `secrets.json` diblokir secara ketat oleh `.gitignore`.
> 3. Jangan pernah mengisi file `.env.example` dengan kredensial rahasia sungguhan. Gunakan nilai placeholder.
> 4. Transaksi on-chain dilakukan secara non-kustodial melalui **Injected Provider (MetaMask)**, sehingga aplikasi tidak pernah memegang kunci pribadi pengguna.

Baca panduan lengkap di: [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### 1. Prasyarat
- **Node.js** (v18 atau lebih baru) & **npm**
- Ekstensi browser **MetaMask** terhubung ke **Ethereum Sepolia Testnet**
- Sedikit Sepolia ETH untuk gas fee (bisa didapatkan di [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

---

### 2. Instalasi & Menjalankan Frontend

1. Pindah ke direktori frontend:
   ```bash
   cd frontend
   ```

2. Pasang seluruh dependensi:
   ```bash
   npm install
   ```

3. (Opsional) Salin template environment jika ingin menggunakan RPC atau WalletConnect ID kustom:
   ```bash
   cp .env.example .env
   ```

4. Jalankan server lokal:
   ```bash
   npm run dev
   ```

5. Buka dApp di browser:
   👉 **`http://localhost:5173/`**

---

### 3. Verifikasi Kode & Build

- **Typecheck TypeScript**:
  ```bash
  npm run typecheck
  ```
- **Production Build**:
  ```bash
  npm run build
  ```

---

## 📚 Tautan Dokumentasi Terkait

- 🏛️ [Sistem Arsitektur](docs/ARCHITECTURE.md)
- 🧮 [Spesifikasi Matematis AMM](docs/AMM_SPECIFICATION.md)
- 🤖 [Spesifikasi Oracle & Event Tracker](docs/AI_ORACLE_SPEC.md)
- 🛡️ [Protokol Keamanan & Zero-Leak](docs/SECURITY.md)

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi **MIT License**.
