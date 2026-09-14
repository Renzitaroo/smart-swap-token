# 🧮 Spesifikasi Matematis AMM (Automated Market Maker)

Dokumen ini membedah model matematika dan algoritma on-chain yang diimplementasikan pada smart contract `SimpleAMM.sol` di platform **RENZIE TRADE**.

---

## 1. Invarian Constant Product ($x \times y = k$)

Model Automated Market Maker (AMM) ini mengadopsi prinsip invarian produk konstan yang dipopulerkan oleh Uniswap v2:

$$x \times y = k$$

Di mana:
- $x$ = Cadangan Token A di pool (`reserveA`)
- $y$ = Cadangan Token B di pool (`reserveB`)
- $k$ = Nilai invarian produk (invariant constant)

Setelah setiap transaksi pertukaran (swap), nilai $k$ baru harus selalu lebih besar atau sama dengan $k$ sebelumnya karena adanya akumulasi fee transaksi.

---

## 2. Perhitungan Jumlah Token Keluar (`getAmountOut`) dengan Biaya 0.3%

Setiap pertukaran dikenakan biaya trading sebesar **0.3%**. Ini berarti hanya **99.7%** dari token yang dimasukkan yang digunakan untuk menggeser kurva invarian, sedangkan **0.3%** sisanya ditinggalkan di dalam kolam sebagai insentif bagi Penyedia Likuiditas (Liquidity Providers).

### Parameter Fee:
- Pengali pembilang (`FEE_NUM`): $997$
- Pembagi dasar (`FEE_DEN`): $1000$

### Penurunan Rumus:
Misalkan pengguna menyetor $\Delta x$ (`amountIn`) untuk memperoleh $\Delta y$ (`amountOut`):

1. Jumlah token masuk efektif setelah dipotong fee 0.3%:
   $$\Delta x_{\text{fee}} = \Delta x \times 997$$

2. Kondisi invarian:
   $$(x \times 1000 + \Delta x_{\text{fee}}) \times (y - \Delta y) = x \times y \times 1000$$

3. Menyelesaikan untuk $\Delta y$ (`amountOut`):
   $$\Delta y = \frac{\Delta x_{\text{fee}} \times y}{(x \times 1000) + \Delta x_{\text{fee}}}$$

### Implementasi Solidity:
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

## 3. Penyediaan Likuiditas (Add Liquidity)

### Setoran Pertama (Initial Liquidity):
Penyetor likuiditas pertama menentukan rasio harga dasar kolam. Jumlah LP shares yang dicetak menggunakan rumus akar geometris:

$$\text{sharesMinted} = \sqrt{\Delta x \times \Delta y}$$

### Setoran Lanjutan (Subsequent Liquidity):
Untuk setoran berikutnya, rasio token yang disetor harus proporsional dengan rasio cadangan pool yang ada saat itu. Jumlah shares yang dicetak dihitung berdasarkan nilai minimum dari porsi token A atau token B untuk mencegah manipulasi rasio:

$$\text{sharesMinted} = \min\left( \frac{\Delta x \times T}{x}, \frac{\Delta y \times T}{y} \right)$$

Di mana $T$ adalah total LP shares yang beredar (`totalShares`).

---

## 4. Penarikan Likuiditas (Remove Liquidity)

Saat penyedia likuiditas membakar $S$ lembar LP shares (`shareAmount`), smart contract mengembalikan Token A dan Token B secara proporsional terhadap kepemilikan mereka di kolam:

$$\Delta x = \frac{S \times x}{T}$$

$$\Delta y = \frac{S \times y}{T}$$

Karena fee 0.3% dari setiap transaksi swap terakumulasi di dalam $x$ dan $y$, nilai pokok token yang ditarik oleh LP akan bertumbuh seiring berjalannya waktu dibandingkan saat pertama kali disetor.
