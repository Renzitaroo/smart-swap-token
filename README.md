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
</p>

---

## 📌 Sekilas Proyek

**RENZIE TRADE** adalah platform pertukaran token terdesentralisasi (DEX) mandiri yang memungkinkan pengguna menukar koin ERC-20 secara instan tanpa perantara, menyetor likuiditas ke dalam pool AMM, serta memantau kesehatan pasar dan rekomendasi swap melalui modul **AI Swap Advisor (Oracle)**.

### 🪙 Identitas Token & Kontrak Terdeploy (Sepolia Testnet)

| Kontrak | Nama & Simbol | Alamat Kontrak (Sepolia) | Etherscan Explorer |
| :--- | :--- | :--- | :--- |
| **Token A** | Renzie ETH (`RZH`) | `0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd` | [Lihat Kontrak](https://sepolia.etherscan.io/address/0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd) |
| **Token B** | ETHJKT Token (`ETHJKT`) | `0x7E96fed902B0A26b62DA78e8112253920Fc55936` | [Lihat Kontrak](https://sepolia.etherscan.io/address/0x7E96fed902B0A26b62DA78e8112253920Fc55936) |
| **AMM Pool** | SimpleAMM (Pasar DEX) | `0xe2418A85060977cBCD13E7ecc2e88E98A0428456` | [Lihat Kontrak](https://sepolia.etherscan.io/address/0xe2418A85060977cBCD13E7ecc2e88E98A0428456) |

* **Deploy TxHash:** [`0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8`](https://sepolia.etherscan.io/tx/0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8)

---

## 🏗️ Struktur Repositori

```text
smart-swap-token/
├── contracts/                # Smart Contracts Solidity (^0.8.20)
│   ├── SimpleAMM.sol         # Mesin Automated Market Maker (x * y = k)
│   ├── Renzie.sol            # Kontrak ERC20 Token Renzie ETH (RZH)
│   ├── EthjktToken.sol       # Kontrak ERC20 Token Pasangan (ETHJKT)
│   └── Tokenku.sol           # Referensi dasar ERC20
├── frontend/                 # Web3 dApp Modern (React + TS + Vite + Wagmi)
│   ├── src/
│   │   ├── App.tsx           # Komponen utama UI swap & likuiditas
│   │   ├── Oracle.tsx        # Komponen AI Swap Advisor / Oracle chart
│   │   ├── abi.ts            # Interface ABI Smart Contract
│   │   ├── wagmi.ts          # Koneksi wallet Viem & provider Sepolia
│   │   └── styles.css        # Desain Liquid Glass & animasi background
│   ├── public/               # Aset logo 4K, icon SVG, dan background animasi
│   ├── config.ts             # Konfigurasi alamat kontrak on-chain
│   └── package.json          # smart-swap-token package config
├── frontend-lite/            # Web swap versi ringan (Vanilla JS/HTML)
├── ai/                       # Prompt sistem AI Swap Advisor & Market Vibe
│   ├── swap-advisor-prompt.md
│   └── market-vibe-prompt.md
├── docs/                     # Dokumentasi & catatan audit Web3
│   ├── LOG-HARI-3.md
│   ├── LOG-HARI-4.md
│   ├── HARI-3-README.md
│   └── HARI-4-README.md
└── README.md
```

---

## 🚀 Panduan Pengoperasian Kode (Langkah Demi Langkah)

### 1. Prasyarat Sistem
Pastikan perangkat kamu telah terpasang:
- **Node.js** (versi 18 ke atas disarankan) & **npm**
- Ekstensi Browser **MetaMask** terhubung ke **Sepolia Testnet**
- Sedikit Sepolia ETH (bisa didapatkan gratis melalui faucet [Google Cloud Web3](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) atau [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/))

---

### 2. Menjalankan Aplikasi Frontend Secara Lokal

1. Buka terminal di direktori proyek:
   ```bash
   cd frontend
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan development server:
   ```bash
   npm run dev
   ```

4. Buka browser ke alamat yang tertera di terminal:
   👉 **`http://localhost:5173/`**

---

### 3. Cara Menggunakan Fitur Swap

1. **Connect Wallet**: Klik tombol **Connect Wallet** di pojok kanan atas untuk menghubungkan akun MetaMask kamu. Pastikan jaringan wallet berada di **Sepolia**.
2. **Pilih Arah Pertukaran**:
   - Gunakan tombol **⇄** untuk memilih apakah ingin menukar **`RZH` ➔ `ETHJKT`** atau **`ETHJKT` ➔ `RZH`**.
3. **Masukkan Jumlah Token**:
   - Ketik jumlah token yang ingin kamu tukar.
   - Sistem akan secara otomatis menghitung estimasi jumlah token yang akan kamu terima berdasarkan formula AMM dan cadangan likuiditas saat ini.
4. **Langkah Transaksi (Dua Tahap)**:
   - **Tahap 1: Approve**  
     Klik tombol **Approve**. Transaksi MetaMask akan muncul meminta izin kepada kontrak SimpleAMM untuk menggunakan token kamu. Konfirmasi transaksi ini.
   - **Tahap 2: Swap**  
     Setelah status approve berhasil, tombol akan berubah menjadi **Swap**. Klik tombol ini dan konfirmasi tanda tangan on-chain di MetaMask.
5. Selesai! Saldo kedua token akan terupdate secara instan.

---

### 4. Mengelola Likuiditas (Liquidity Pool)

1. Klik tab **Liquidity** pada menu utama.
2. **Add Liquidity**:
   - Masukkan jumlah `RZH` dan `ETHJKT` yang ingin kamu pasok ke kolam likuiditas.
   - Klik **Approve** pada masing-masing token, lalu klik **Add Liquidity**.
   - Kamu akan menerima **LP Shares** sebagai bukti kepemilikan atas pool tersebut dan berhak memperoleh fee 0.3% dari setiap transaksi swap pengguna lain.
3. **Remove Liquidity**:
   - Masukkan jumlah LP Shares yang ingin kamu cairkan.
   - Klik **Remove Liquidity** untuk menarik kembali pokok token beserta akumulasi fee secara proporsional.

---

### 5. Memanfaatkan Fitur AI Swap Advisor (Oracle)

1. Klik tab **Oracle**.
2. Modul ini menganalisis rasio perbandingan cadangan token di pool terhadap pergerakan pasar.
3. Menampilkan grafik visual dan evaluasi keamanan swap (apakah slippage terlalu besar, timing beli/jual yang optimal, atau pool kekurangan likuiditas).

---

### 6. Kompilasi & Deploy Smart Contract Baru (Via Remix IDE)

Jika kamu ingin memodifikasi atau mendeploy ulang smart contract sendiri:
1. Kunjungi **[Remix Ethereum IDE](https://remix.ethereum.org/)**.
2. Buat file baru dan salin isi dari [`contracts/Renzie.sol`](contracts/Renzie.sol) dan [`contracts/SimpleAMM.sol`](contracts/SimpleAMM.sol).
3. Pada tab **Solidity Compiler**, pilih versi compiler `0.8.20` atau lebih baru, lalu klik **Compile**.
4. Pada tab **Deploy & Run Transactions**:
   - Ubah *Environment* menjadi **Injected Provider - MetaMask**.
   - Deploy `Renzie.sol` terlebih dahulu. Catat alamat contract-nya.
   - Deploy `SimpleAMM.sol` dengan memasukkan parameter `_tokenA` (alamat Renzie) dan `_tokenB` (alamat token pair).
5. Salin alamat contract baru tersebut ke dalam file konfigurasi frontend:
   [`frontend/config.ts`](frontend/config.ts).

---

## 🧮 Rumus Inti Automated Market Maker (AMM)

Kontrak `SimpleAMM.sol` mengimplementasikan formula **Constant Product Invariant**:

$$x \times y = k$$

Di mana:
- $x$ = Cadangan Token A di pool (`reserveA`)
- $y$ = Cadangan Token B di pool (`reserveB`)
- $k$ = Konstanta invariant yang harus tetap terjaga setelah transaksi swap.

Setiap pertukaran dikenakan biaya trading sebesar **0.3%** (`FEE_NUM = 997`, `FEE_DEN = 1000`) yang dihitung dalam fungsi `getAmountOut()`:

$$\text{amountInWithFee} = \text{amountIn} \times 997$$

$$\text{amountOut} = \frac{\text{amountInWithFee} \times \text{reserveOut}}{(\text{reserveIn} \times 1000) + \text{amountInWithFee}}$$

---

## 🛡️ Keamanan & Lisensi

Proyek ini dibangun sebagai bagian dari kurikulum edukasi Web3 berstandar keamanan industri. Seluruh interaksi contract pada `SimpleAMM.sol` menerapkan prinsip *checks-effects-interactions* untuk melindungi likuiditas dari serangan reentrancy.

Dilisensikan di bawah **MIT License**.
