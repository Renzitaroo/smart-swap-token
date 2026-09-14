# 🛡️ Panduan Keamanan & Pencegahan Kebocoran Data (Zero-Leak Protocol)

Keamanan adalah prioritas mutlak dalam pengembangan aplikasi Web3 dan Smart Contract. Dokumen ini merangkum aturan ketat dan panduan operasional untuk mencegah kebocoran data (*data leak*) dan menjaga integritas dana pengguna.

---

## 🚫 1. Protokol Pencegahan Kebocoran Data (Zero-Leak)

### Aturan Emas Repositori:
1. **DILARANG KERAS MENG-COMMIT PRIVATE KEY ATAU SEED PHRASE**:
   - Jangan pernah menyalin, menempel, atau menyimpan kunci privat (private key) wallet atau seed phrase 12/24 kata ke dalam file apa pun di repositori (termasuk kode JavaScript, file Markdown, log, atau komentar).
   - Pengembang dilarang menggunakan wallet utama (mainnet) dengan saldo riil saat melakukan pengujian. Gunakan dompet baru khusus testnet Sepolia.
2. **ISOLASI FILE LINGKUNGAN (.ENV)**:
   - File `.env`, `.env.local`, `.env.production` sudah secara ketat dimasukkan ke dalam `.gitignore`.
   - Hanya file contoh tanpa rahasia riil (`.env.example`) yang boleh dimasukkan ke dalam repositori.
3. **PENGGUNAAN INJECTED PROVIDER**:
   - Transaksi write on-chain di frontend ditandatangani secara eksklusif melalui ekstensi browser (misalnya MetaMask) via Injected Provider EIP-1193.
   - Frontend tidak pernah meminta, membaca, atau menyimpan private key pengguna di memory maupun penyimpanan lokal (`localStorage`).

---

## 🔒 2. Daftar Pola Terblokir di `.gitignore`

Repositori ini telah dikonfigurasi dengan aturan pencegahan kebocoran data berlapis:
- Ekstensi file kunci & sertifikat: `*.key`, `*.pem`, `*.p12`, `*.pfx`, `*.keystore`, `keystore/`.
- File kredensial dompet: `secrets.json`, `credentials.json`, `wallet.json`, `mnemonic.txt`, `seed.txt`.
- Kunci SSH & otentikasi server: `id_rsa*`, `id_ecdsa*`, `id_ed25519*`.
- File cache & artefak build: `node_modules/`, `dist/`, `build/`, `artifacts/`, `cache/`.

---

## ⚖️ 3. Pola Keamanan Smart Contract (`SimpleAMM.sol`)

### Pola Checks-Effects-Interactions:
Pada fungsi sensitif seperti `removeLiquidity`, pembaruan status internal kontrak (*effects*) selalu dieksekusi **sebelum** melakukan transfer token keluar (*interactions*):

```solidity
// 1. CHECKS: Validasi input dan kepemilikan saham
require(shareAmount > 0, "nol");
require(shares[msg.sender] >= shareAmount, "shares kurang");

// 2. EFFECTS: Kurangi status internal terlebih dahulu
shares[msg.sender] -= shareAmount;
totalShares -= shareAmount;
reserveA -= amountA;
reserveB -= amountB;

// 3. INTERACTIONS: Transfer token keluar ke pengguna
tokenA.transfer(msg.sender, amountA);
tokenB.transfer(msg.sender, amountB);
```

### Mekanisme Dua Tahap (Approve & Transfer):
Standar ERC-20 mengharuskan otorisasi eksplisit via `approve()` sebelum kontrak AMM dapat menarik token dari dompet pengguna melalui `transferFrom()`. Ini mencegah kontrak pintar mengambil dana tanpa persetujuan pengguna.
