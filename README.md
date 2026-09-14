# ⚡ RENZIE TRADE — Smart Swap Token & AMM DEX

<p align="center">
  <img src="frontend/public/renzie-trade-logo.svg" alt="RENZIE TRADE Logo" width="550" />
</p>

<p align="center">
  <b>Decentralized Exchange (DEX) berbasis Automated Market Maker (AMM) Constant Product Invariant Formula ($x \times y = k$) di jaringan Ethereum Sepolia Testnet.</b>
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

**RENZIE TRADE** adalah platform pertukaran aset terdesentralisasi (DEX) mandiri berstandar Web3 modern. Platform ini memungkinkan siapa saja untuk melakukan transaksi pertukaran token ERC-20 secara *permissionless* tanpa perantara sentral, menyetor modal ke dalam kolam likuiditas (*Liquidity Pool*) untuk memperoleh bagi hasil biaya transaksi (*trading fee yield*), serta memantau kesehatan pasar dan pergerakan harga melalui modul **On-Chain Event Oracle & Activity Tracker**.

### 🪙 Identitas Token & Kontrak Terdeploy (Sepolia Testnet)

| Kontrak | Nama & Simbol | Alamat Kontrak (Sepolia) | Status Explorer |
| :--- | :--- | :--- | :--- |
| **Token A** | Renzie ETH (`RZH`) | `0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd` | [Etherscan Sepolia ↗](https://sepolia.etherscan.io/address/0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd) |
| **Token B** | ETHJKT Token (`ETHJKT`) | `0x7E96fed902B0A26b62DA78e8112253920Fc55936` | [Etherscan Sepolia ↗](https://sepolia.etherscan.io/address/0x7E96fed902B0A26b62DA78e8112253920Fc55936) |
| **AMM Pool** | SimpleAMM (Pasar DEX) | `0xe2418A85060977cBCD13E7ecc2e88E98A0428456` | [Etherscan Sepolia ↗](https://sepolia.etherscan.io/address/0xe2418A85060977cBCD13E7ecc2e88E98A0428456) |

* **Deploy Transaction Hash:** [`0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8`](https://sepolia.etherscan.io/tx/0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8)

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

## 🌟 Penjelasan Signifikan Seluruh Fitur Platform

Platform RENZIE TRADE dirancang dengan arsitektur desentralisasi penuh (*fully trustless*). Berikut adalah rincian mendalam mengenai cara kerja dan signifikansi dari setiap fitur utama:

```
+-----------------------------------------------------------------------------------+
|                            FITUR UTAMA RENZIE TRADE                               |
+-----------------------------------------------------------------------------------+
|  1. AMM Swap Engine     : Invarian x * y = k + Potongan Fee 0.3% + 2-Step Safety  |
|  2. Liquidity Pool      : Auto-Ratio Sync + LP Shares Minting + Akumulasi Hasil   |
|  3. On-Chain Oracle     : eth_getLogs Event Scraping + Volume Ranking + Chart SVG |
|  4. AI Advisor Off-Chain: Simulasi Toleransi Slippage Sebelum Tandatangan On-Chain|
|  5. Audit Ledger & Logs : Riwayat Terhubung Etherscan Sepolia Transparan          |
|  6. Liquid Glass UI/UX  : Dark/Light Mode + Glassmorphism Spekular Dinamis        |
+-----------------------------------------------------------------------------------+
```

---

### 1. ⚡ Mesin Swap AMM Constant Product ($x \times y = k$)

#### Mengapa Fitur Ini Signifikan?
Pada bursa terpusat tradisional (CEX), pertukaran membutuhkan buku pesanan (*Order Book*) dan perantara (*market maker*). Jika tidak ada pihak lawan yang ingin bertransaksi pada harga yang cocok, transaksi akan tertahan. 
**AMM (Automated Market Maker)** meniadakan ketergantungan pada pihak ketiga. Kolam likuiditas berdiri mandiri sebagai lawan transaksi otomatis. Harga ditentukan secara matematis dan deterministik oleh rasio saldo kedua token di dalam kontrak.

#### Mekanisme Kerja On-Chain:
1. **Invarian Produk Konstan ($x \times y = k$)**:
   Kontrak menjaga agar hasil kali antara cadangan Token A ($x$) dan cadangan Token B ($y$) selalu konstan sebelum memperhitungkan biaya.
2. **Pemotongan Fee Likuiditas 0.3% (`FEE_NUM = 997`, `FEE_DEN = 1000`)**:
   Dari setiap 1.000 unit token yang disetor pengguna, hanya 997 unit yang dihitung untuk menggeser kurva harga, sementara 3 unit ditinggalkan di dalam kolam.
3. **Pertumbuhan Nilai $k$ On-Chain**:
   Karena 0.3% fee tertinggal di kolam, nilai $k$ setelah swap selalu sedikit lebih besar ($k_{\text{baru}} \ge k_{\text{lama}}$). Ini merupakan sumber pertumbuhan nilai aset milik penyedia likuiditas.

#### Formula On-Chain (`getAmountOut`):
$$\text{amountInWithFee} = \text{amountIn} \times 997$$

$$\text{amountOut} = \frac{\text{amountInWithFee} \times \text{reserveOut}}{(\text{reserveIn} \times 1000) + \text{amountInWithFee}}$$

#### Simulasi Transaksi Riil:
- **Kondisi Awal**: Pool memiliki cadangan $1.000\text{ RZH}$ dan $1.000\text{ ETHJKT}$.
- **Aksi Pengguna**: Menukar $100\text{ RZH}$ ke $\text{ETHJKT}$.
- **Kalkulasi**:
  - $\text{amountInWithFee} = 100 \times 997 = 99.700$
  - $\text{Numerator} = 99.700 \times 1.000 = 99.700.000$
  - $\text{Denominator} = (1.000 \times 1.000) + 99.700 = 1.099.700$
  - $\text{amountOut} = \frac{99.700.000}{1.099.700} \approx 90,6609\text{ ETHJKT}$
- **Cadangan Baru**: $1.100\text{ RZH}$ dan $909,3391\text{ ETHJKT}$.
- **Hasil**: Pengguna memperoleh $90,6609\text{ ETHJKT}$. Biaya likuiditas sebesar $0,3\text{ RZH}$ otomatis masuk ke cadangan kolam.

#### Mekanisme Keamanan 2-Step (Approve $\rightarrow$ Swap):
Sesuai standar ERC-20, kontrak pintar tidak diizinkan mendebit token dari dompet pengguna tanpa persetujuan eksplisit.
- **Tahap 1 (Approve)**: Pengguna menandatangani transaksi `approve(ammAddress, amount)` untuk menetapkan batas penarikan.
- **Tahap 2 (Swap)**: Kontrak mengeksekusi `transferFrom` untuk menarik token masuk, menghitung `amountOut`, dan mentransfer token tujuan keluar ke dompet pengguna.

---

### 2. 💧 Manajemen Kolam Likuiditas (Liquidity Pool & LP Shares)

#### Mengapa Fitur Ini Signifikan?
Fitur ini mengubah setiap pengguna menjadi bankir mandiri. Dengan memasok aset ke dalam pool, penyedia likuiditas (*Liquidity Providers / LP*) mendanai likuiditas publik dan memperoleh pendapatan pasif dari setiap aktivitas swap yang terjadi di bursa.

#### Mekanisme Kerja:
1. **Setoran Perdana (Initial Liquidity)**:
   Penyetor pertama bebas menentukan rasio harga dasar kolam. Jumlah LP shares yang dicetak dihitung melalui akar kuadrat geometris:
   $$\text{sharesMinted} = \sqrt{\text{amountA} \times \text{amountB}}$$
2. **Setoran Lanjutan (Subsequent Liquidity & Auto-Pair)**:
   Untuk setoran setelahnya, rasio token A dan token B harus persis sama dengan rasio cadangan yang ada saat itu. Frontend RENZIE TRADE memiliki fitur **Auto-Pair**: ketika pengguna memasukkan nilai token A, sistem otomatis menghitung dan mengunci jumlah token B yang setara:
   $$\text{amountB} = \frac{\text{amountA} \times \text{reserveB}}{\text{reserveA}}$$
   Jumlah lembar LP shares yang dicetak diambil dari nilai minimum untuk mencegah manipulasi rasio:
   $$\text{minted} = \min\left( \frac{\text{amountA} \times \text{totalShares}}{\text{reserveA}}, \frac{\text{amountB} \times \text{totalShares}}{\text{reserveB}} \right)$$
3. **Penarikan Likuiditas (Remove Liquidity & Burn Shares)**:
   Penyedia likuiditas dapat mencairkan modal kapan saja dengan membakar (*burn*) lembar saham LP mereka. Kontrak mengembalikan pokok aset ditambah akumulasi fee:
   $$\text{porsiA} = \frac{\text{sharesBurned} \times \text{reserveA}}{\text{totalShares}}, \quad \text{porsiB} = \frac{\text{sharesBurned} \times \text{reserveB}}{\text{totalShares}}$$
4. **Proteksi Checks-Effects-Interactions**:
   Pada fungsi `removeLiquidity()`, saldo shares dan total shares dikurangi terlebih dahulu di penyimpanan kontrak (*effects*) sebelum transfer token on-chain dijalankan (*interactions*), guna menutup celah serangan reentrancy.

---

### 3. 📡 Modul On-Chain Oracle & Live Activity Tracker

#### Mengapa Fitur Ini Signifikan?
Sebagian besar aplikasi Web2 mengandalkan database terpusat (MySQL/Firebase) untuk menampilkan riwayat transaksi dan grafik. Jika server database mati, data hilang.
**RENZIE TRADE menerapkan prinsip On-Chain Sovereign Data**: seluruh aktivitas dan grafik pergerakan volume dibaca langsung dari event log blockchain Ethereum Sepolia (`eth_getLogs`).

#### Komponen Utama Modul Oracle:
1. **Live Event Scraping Tanpa Backend**:
   Komponen `Oracle.tsx` memindai log `event Swapped(address user, address tokenIn, uint256 amountIn, uint256 amountOut)` di jaringan Sepolia secara berkala setiap 6 detik. Pengguna dapat memilih kedalaman blok pemindaian dari 3.000 hingga 200.000 blok terakhir.
2. **Metrik Volume & Dominasi Pasar**:
   Sistem mengakumulasi volume masuk untuk setiap token dan menghitung persentase dominasi trading:
   $$\%_{\text{Dominasi A}} = \frac{\text{Volume}_A}{\text{Volume}_A + \text{Volume}_B} \times 100\%$$
3. **Penobatan Token Paling Aktif (👑 Champion Token)**:
   Secara dinamis mendeteksi token yang paling diminati pasar pada jendela blok terkini.
4. **Analisis Peluang Arbitrase (Arbitrage Indicator)**:
   Sistem membandingkan harga spot on-chain terhadap feed harga oracle referensi:
   $$\text{Deviasi} = \frac{P_{\text{oracle}} - P_{\text{pool}}}{P_{\text{pool}}} \times 100\%$$
   - **Deviasi $> 1\%$**: Menandai peluang arbitrase bagi trader untuk menyeimbangkan harga pool dengan pasar luar.
   - **Deviasi $< 1\%$**: Menandai pasar dalam keadaan seimbang dan efisien.
5. **Grafik SVG Interaktif Tanpa Pustaka Eksternal**:
   Grafik harga di-render murni menggunakan vektor SVG native yang sangat ringan, menampilkan pergerakan harga pool (biru) vs oracle referensi (kuning).

---

### 4. 🧠 Modul AI Swap Advisor (Off-Chain Pre-Swap Gate)

#### Mengapa Fitur Ini Signifikan?
Di dunia Web3, transaksi yang telah ditandatangani di dompet dan dimasukkan ke dalam blok bersifat **abadi dan final (irreversible)**. Tidak ada opsi pembatalan atau *customer support* untuk mengembalikan token yang hilang akibat slippage ekstrem.

#### Prinsip Kerja & Filosofi Kritis:
- **Gerbang Pertimbangan Kedua (Second Opinion)**: Sebelum menandatangani transaksi bernilai besar, pengguna dapat meminta evaluasi cepat dari LLM / AI Swap Advisor mengenai batas toleransi slippage dan kesehatan cadangan pool.
- **Hierarki Kebenaran (Source of Truth)**: AI dapat berhalusinasi atau salah dalam kalkulasi matematika yang kompleks. Oleh karena itu, arsitektur RENZIE TRADE menetapkan aturan baku:
  > **Kontrak On-Chain adalah satu-satunya sumber kebenaran mutlak.** Estimasi AI hanyalah referensi pertimbangan, sedangkan eksekusi final selalu ditentukan oleh fungsi `getAmountOut()` di smart contract.

---

### 5. 📜 Riwayat Transaksi Lokal Terintegrasi Etherscan

#### Mengapa Fitur Ini Signifikan?
Memberikan jaminan transparansi penuh dan rekam jejak audit yang dapat diverifikasi secara publik oleh siapa saja.
- **Penyimpanan Lokal Terisolasi**: Riwayat transaksi disimpan di `localStorage` per alamat kontrak AMM.
- **Verifikasi Satu Klik ke Etherscan**: Setiap transaksi pertukaran, penambahan likuiditas, dan penarikan saham dilengkapi tautan langsung ke **Sepolia Etherscan Explorer** berdasarkan transaction hash (`txHash`), memudahkan audit transaksi status sukses, gas fee yang terpakai, dan nomor blok transaksi.

---

### 6. 💎 Desain Antarmuka Liquid Glassmorphism & Multi-Theme

- **Desain Modern**: Memadukan efek pantulan kaca specular (*Liquid Glass*), filter blur backdrop, dan aksen neon cyber.
- **Tema Dinamis**: Mendukung pengalihan mode Gelap (Dark Mode) dan Terang (Light Mode) secara instan tanpa memuat ulang halaman.
- **Feedback Transaksi Interaktif**: Tombol aksi dinamis menampilkan tahapan proses secara real-time (*Menunggu Approval*, *Menunggu Konfirmasi Blok*, *Sukses*).

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### 1. Prasyarat Sistem
- **Node.js** versi 18 ke atas & **npm**
- Ekstensi browser **MetaMask** terhubung ke **Sepolia Testnet**
- Sedikit Sepolia ETH untuk gas fee ([Google Cloud Web3 Faucet ↗](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

---

### 2. Menjalankan dApp Secara Lokal

```bash
# 1. Pindah ke folder frontend
cd frontend

# 2. Pasang seluruh dependensi
npm install

# 3. Jalankan development server
npm run dev
```

Buka peramban Anda ke tautan yang muncul di terminal:
👉 **`http://localhost:5173/`**

---

### 3. Verifikasi Kode & Build Produksi

```bash
# Uji tipe data TypeScript (Strict Typecheck)
npm run typecheck

# Jalankan bundle build produksi
npm run build
```

---

## 🛡️ Kebijakan Keamanan & Zero-Leak

1. **JANGAN PERNAH MENYIMPAN PRIVATE KEY / SEED PHRASE DI DALAM KODE ATAU REPOSITORI.**
2. File environment lokal `.env` diblokir secara mutlak oleh `.gitignore`. Gunakan template aman [`.env.example`](.env.example).
3. Transaksi write hanya ditandatangani melalui Injected Provider MetaMask, sehingga kunci privat Anda tidak pernah meninggalkan dompet Anda.

Baca selengkapnya di: [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 📚 Tautan Dokumentasi Teknis

- 🏛️ [Arsitektur Sistem EVM & dApp](docs/ARCHITECTURE.md)
- 🧮 [Spesifikasi Matematis Lengkap AMM](docs/AMM_SPECIFICATION.md)
- 🤖 [Spesifikasi Oracle & Event Scraping](docs/AI_ORACLE_SPEC.md)
- 🛡️ [Protokol Keamanan & Zero-Leak](docs/SECURITY.md)

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi **MIT License**.
