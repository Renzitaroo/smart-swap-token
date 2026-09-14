# 🤖 Spesifikasi Modul Oracle & Event Analytics

Dokumen ini mendokumentasikan fungsionalitas modul **Oracle & Activity Tracker** yang tersemat pada antarmuka dApp **RENZIE TRADE**.

---

## 1. On-Chain Event Scraping (`eth_getLogs`)

Alih-alih mengandalkan basis data tersentralisasi (seperti PostgreSQL atau Firebase), RENZIE TRADE memanfaatkan sifat transparansi blockchain EVM dengan membaca langsung log kejadian on-chain:

- **Target Event**: `event Swapped(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut)`
- **Jendela Pemindaian**: Mendukung pemilihan rentang 3.000 hingga 200.000 blok terakhir di Sepolia Testnet.
- **Interval Pembaruan**: Pemindaian otomatis berulang setiap 6 detik menggunakan Web3 client `@wagmi/core`.

### Metrik Analisis yang Dihitung di Frontend:
1. **Total Volume Per Token**:
   $$\text{Volume}_A = \sum \text{amountIn}_{(\text{tokenIn} = A)}$$
   $$\text{Volume}_B = \sum \text{amountIn}_{(\text{tokenIn} = B)}$$
2. **Distribusi Persentase Dominasi**:
   $$\%_A = \frac{\text{Volume}_A}{\text{Volume}_A + \text{Volume}_B} \times 100\%$$
3. **Champion Token**: Token dengan volume aliran masuk terbesar ke dalam pool DEX.

---

## 2. Simulasi Reference Price Oracle (Chainlink Style)

Untuk mendemonstrasikan evaluasi arbitrase dan deviasi harga:
- **Harga On-Chain**:
  $$P_{\text{pool}} = \frac{\text{reserveB} \times 10^{\text{decA}}}{\text{reserveA} \times 10^{\text{decB}}}$$
- **Harga Oracle Referensi**:
  Menggunakan model *mean-reverting* dengan komponen *noise* acak realistis yang mensimulasikan feed data eksternal (misal: Chainlink / Pyth Network):
  $$P_{\text{next}} = (0.82 \times P_{\text{prev}}) + (0.18 \times P_{\text{pool}}) + \text{Noise}$$
- **Persentase Deviasi**:
  $$\text{Deviasi} = \frac{P_{\text{oracle}} - P_{\text{pool}}}{P_{\text{pool}}} \times 100\%$$
  - Deviasi $> 1\%$: Mengindikasikan potensi arbitrase yang menguntungkan.
  - Deviasi $< 1\%$: Pasar relatif efisien dan seimbang.

---

## 3. Template Prompt AI Swap Advisor (Off-Chain Pre-Swap Gate)

Untuk integrasi LLM atau AI agent off-chain sebelum pengguna menandatangani transaksi on-chain:

```markdown
Kamu adalah sistem penasihat transaksi pada AMM DEX Constant Product (rumus x*y=k, fee 0.3%).
Berikut adalah status likuiditas on-chain terkini:
- reserveIn  : <masukkan nilai>
- reserveOut : <masukkan nilai>
- amountIn   : <masukkan nilai>

Tugas Evaluasi:
1. Hitung perkiraan token yang diterima berdasarkan formula AMM fee 0.3%.
2. Hitung perkiraan Price Impact (Slippage) dalam persen.
3. Berikan rekomendasi singkat: apakah likuiditas memadai atau slippage berisiko tinggi.
Keluarkan output dalam format JSON:
{
  "perkiraanTerima": <angka>,
  "priceImpactPersen": <angka>,
  "verdict": "<aman / waspada slippage tinggi>"
}
```

> **Catatan Keamanan Penting**:
> Hasil estimasi AI hanyalah opini sekunder. Nilai transaksi final yang mengikat secara on-chain selalu ditentukan secara matematis oleh smart contract melalui fungsi `getAmountOut()`.
