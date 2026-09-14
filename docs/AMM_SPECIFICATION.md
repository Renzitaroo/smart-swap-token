# 🧮 Spesifikasi Matematis AMM (Automated Market Maker)

Dokumen ini menyajikan rincian teknis, model matematika, penurunan rumus, serta simulasi numerik mendalam yang diimplementasikan pada smart contract `SimpleAMM.sol` di platform **RENZIE TRADE**.

---

## 1. Invarian Constant Product ($x \times y = k$)

Model Automated Market Maker (AMM) ini mengadopsi prinsip invarian produk konstan yang dipopulerkan oleh Uniswap v2:

$$x \times y = k$$

Di mana:
- $x$ = Cadangan Token A di pool (`reserveA`)
- $y$ = Cadangan Token B di pool (`reserveB`)
- $k$ = Nilai invarian produk (invariant constant)

Setiap transaksi swap memodifikasi rasio $x$ dan $y$ di sepanjang kurva hiperbola $y = \frac{k}{x}$. Tanpa biaya transaksi, nilai $k$ akan selalu tetap sama. Namun dengan adanya fee trading 0.3%, nilai $k$ baru akan selalu bertambah besar secara monoton:

$$k_{\text{sesudah}} \ge k_{\text{sebelum}}$$

---

## 2. Perhitungan Jumlah Token Keluar (`getAmountOut`) dengan Biaya 0.3%

Setiap pertukaran dikenakan biaya likuiditas sebesar **0.3%**. Artinya, hanya **99.7%** dari token yang disetor yang diperhitungkan untuk menggeser kurva invarian, sementara **0.3%** sisanya ditinggalkan di dalam kolam sebagai insentif bagi Penyedia Likuiditas (Liquidity Providers).

### Parameter Fee:
- Pengali pembilang (`FEE_NUM`): $997$
- Pembagi dasar (`FEE_DEN`): $1000$

### Penurunan Rumus:
Misalkan pengguna menyetor $\Delta x$ (`amountIn`) untuk memperoleh $\Delta y$ (`amountOut`):

1. **Jumlah token masuk efektif setelah dipotong fee 0.3%**:
   $$\Delta x_{\text{fee}} = \Delta x \times \frac{997}{1000} = \frac{997 \cdot \Delta x}{1000}$$

2. **Kondisi invarian produk konstan**:
   $$(x + \Delta x_{\text{fee}}) \cdot (y - \Delta y) = x \cdot y$$

3. **Substitusi persamaan**:
   $$y - \Delta y = \frac{x \cdot y}{x + \Delta x_{\text{fee}}}$$
   $$\Delta y = y - \frac{x \cdot y}{x + \Delta x_{\text{fee}}} = \frac{y \cdot (x + \Delta x_{\text{fee}}) - x \cdot y}{x + \Delta x_{\text{fee}}} = \frac{\Delta x_{\text{fee}} \cdot y}{x + \Delta x_{\text{fee}}}$$

4. **Menghilangkan pecahan dengan mengalikan pembilang dan penyebut dengan 1000**:
   $$\Delta y = \frac{997 \cdot \Delta x \cdot y}{1000 \cdot x + 997 \cdot \Delta x}$$

### Implementasi Solidity On-Chain:
```solidity
function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
) public pure returns (uint256) {
    require(amountIn > 0, "input nol");
    require(reserveIn > 0 && reserveOut > 0, "pool kosong");
    uint256 amountInWithFee = amountIn * FEE_NUM;
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = (reserveIn * FEE_DEN) + amountInWithFee;
    return numerator / denominator;
}
```

---

## 3. Analisis Matematis Price Impact & Slippage

Terdapat perbedaan mendasar antara **Harga Spot Marjinal** ($P_{\text{spot}}$) sebelum transaksi dengan **Harga Eksekusi Efektif** ($P_{\text{eksekusi}}$) yang dialami pengguna:

### 1. Harga Spot Marjinal:
$$P_{\text{spot}} = \frac{y}{x}$$

### 2. Harga Eksekusi Efektif:
$$P_{\text{eksekusi}} = \frac{\Delta y}{\Delta x} = \frac{997 \cdot y}{1000 \cdot x + 997 \cdot \Delta x}$$

### 3. Price Impact (Persentase Pergeseran Harga):
$$\text{Price Impact} = \frac{P_{\text{spot}} - P_{\text{eksekusi}}}{P_{\text{spot}}} = 1 - \frac{997 \cdot x}{1000 \cdot x + 997 \cdot \Delta x}$$

Untuk perkiraan cepat pada nilai fee kecil, pergeseran harga sebanding dengan ukuran order terhadap kedalaman likuiditas kolam:
$$\text{Price Impact} \approx \frac{\Delta x}{x + \Delta x} \times 100\%$$

> **Implikasi Desain**:
> Semakin besar jumlah token yang ditukar ($\Delta x$) relatif terhadap cadangan kolam ($x$), semakin besar Price Impact yang terjadi. Hal ini melindungi kolam dari pengurasan total likuiditas oleh satu pihak (*liquidity drainage protection*).

---

## 4. Penyediaan Likuiditas (Add Liquidity)

### Setoran Pertama (Initial Liquidity):
Penyetor likuiditas pertama menentukan rasio harga dasar kolam. Jumlah LP shares yang dicetak menggunakan rumus akar geometris (*geometric mean*):

$$\text{sharesMinted} = \sqrt{\Delta x \times \Delta y}$$

### Setoran Lanjutan (Subsequent Liquidity):
Untuk setoran berikutnya, rasio token yang disetor harus proporsional dengan rasio cadangan pool saat itu. Jumlah shares yang dicetak dihitung berdasarkan nilai minimum dari porsi token A atau token B untuk mencegah manipulasi rasio:

$$\text{sharesMinted} = \min\left( \frac{\Delta x \times T}{x}, \frac{\Delta y \times T}{y} \right)$$

Di mana $T$ adalah total LP shares yang beredar (`totalShares`).

---

## 5. Penarikan Likuiditas (Remove Liquidity)

Saat penyedia likuiditas membakar $S$ lembar LP shares (`shareAmount`), smart contract mengembalikan Token A dan Token B secara proporsional terhadap porsi kepemilikan mereka di kolam:

$$\Delta x = \frac{S \times x}{T}$$

$$\Delta y = \frac{S \times y}{T}$$

Karena fee 0.3% dari setiap transaksi swap terakumulasi di dalam $x$ dan $y$, nilai pokok token yang ditarik oleh LP akan bertumbuh seiring berjalannya waktu dibandingkan saat pertama kali disetor.

---

## 6. Simulasi Numerik Riil Langkah demi Langkah (Studi Kasus)

Berikut adalah simulasi numerik berbasis unit wei ($10^{18}$):

### Skenario:
- **Cadangan Awal**:
  - $x = 1.000\text{ RZH} = 1.000 \times 10^{18}\text{ wei}$
  - $y = 1.000\text{ ETHJKT} = 1.000 \times 10^{18}\text{ wei}$
  - $k_{\text{awal}} = 1.000 \times 1.000 = 1.000.000$
- **Total Saham Awal ($T$)**:
  - $T = \sqrt{1.000 \times 1.000} = 1.000\text{ LP Shares}$

### Eksekusi Swap:
- **Pengguna menukar**: $\Delta x = 100\text{ RZH}$
- **Perhitungan**:
  $$\text{amountInWithFee} = 100 \times 997 = 99.700$$
  $$\text{Numerator} = 99.700 \times 1.000 = 99.700.000$$
  $$\text{Denominator} = (1.000 \times 1.000) + 99.700 = 1.099.700$$
  $$\Delta y = \frac{99.700.000}{1.099.700} = 90,6609\text{ ETHJKT}$$
- **Cadangan Baru Setelah Swap**:
  - $x_{\text{baru}} = 1.000 + 100 = 1.100\text{ RZH}$
  - $y_{\text{baru}} = 1.000 - 90,6609 = 909,3391\text{ ETHJKT}$
  - $k_{\text{baru}} = 1.100 \times 909,3391 = 1.000.273$

### Analisis Hasil:
1. Pengguna mendapatkan **$90,6609\text{ ETHJKT}$**.
2. Nilai invarian produk naik dari **$1.000.000 \rightarrow 1.000.273$** ($+273$).
3. Kenaikan nilai $k$ ini membuktikan bahwa biaya transaksi $0,3\%$ ($0,3\text{ RZH}$) telah menjadi hak milik bersama seluruh penyedia likuiditas secara permanen.
