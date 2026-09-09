import { useEffect, useMemo, useRef, useState } from "react";
import { getBlockNumber, getPublicClient } from "@wagmi/core";
import { formatUnits } from "viem";

import { CONFIG } from "../config";
import { SWAP_EVENT } from "./abi";
import { wagmiConfig } from "./wagmi";

// ---------- tipe ----------
type SwapEvt = {
  tokenIn: string;
  amountIn: bigint;
  amountOut: bigint;
  blockNumber: bigint;
};

type PoolPoint = { t: number; p: number; o: number };

type Props = {
  reserveA: bigint;
  reserveB: bigint;
  decA: number;
  decB: number;
  symA: string;
  symB: string;
  aLogo: string;
  bLogo: string;
};

const LOCAL_BLOCK_WINDOW = 3000n; // berapa blok kebelakang buat di-scan

// ---------- util ----------
function fmtNum(x: number) {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 6 });
}
function fmt2(x: number) {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}
function short(addr: string) {
  return addr.toLowerCase().slice(0, 6) + "…" + addr.toLowerCase().slice(-4);
}

export default function Oracle({
  reserveA,
  reserveB,
  decA,
  decB,
  symA,
  symB,
  aLogo,
  bLogo,
}: Props) {
  // ---------- harga pool (x*y=k -> harga A dlm satuan B) ----------
  const poolPrice =
    reserveA > 0n && reserveB > 0n && decA > 0 && decB > 0
      ? (Number(reserveB) * 10 ** decA) / (Number(reserveA) * 10 ** decB)
      : null;

  // ---------- oracle referensi (mock, mean-revert ke harga pool) ----------
  const oracleRef = useRef<number | null>(null);
  const [hist, setHist] = useState<PoolPoint[]>([]);
  useEffect(() => {
    if (poolPrice == null || !isFinite(poolPrice)) return;
    const prev = oracleRef.current;
    let next: number;
    if (prev == null) {
      const drift = (Math.random() - 0.5) * poolPrice * 0.1; // sengaja mulai nggak persis
      next = poolPrice * (1 + drift);
    } else {
      // "Chainlink-style": feed nangkis pasar, tarik pelan-pelan ke harga pool
      // (arbitrase nyamain), plus noise biar keliatan hidup.
      next = prev * 0.82 + poolPrice * 0.18 + (Math.random() - 0.5) * poolPrice * 0.012;
    }
    oracleRef.current = next;
    setHist((h) => [...h, { t: Date.now(), p: poolPrice, o: next }].slice(-40));
  }, [poolPrice]);

  const oracle = oracleRef.current;

  // ---------- local activity: baca event Swapped on-chain ----------
  const [events, setEvents] = useState<SwapEvt[]>([]);
  const [scanBlocks, setScanBlocks] = useState(LOCAL_BLOCK_WINDOW);
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval>;

    async function load() {
      try {
        const latest = await getBlockNumber(wagmiConfig);
        const publicClient = getPublicClient(wagmiConfig);
        const logs = await publicClient.getLogs({
          address: CONFIG.AMM_ADDRESS as `0x${string}`,
          event: SWAP_EVENT,
          fromBlock: latest - scanBlocks,
          toBlock: "latest",
        });
        if (!alive) return;
        setEvents(
          logs.map((l: any) => ({
            tokenIn: String(l.args?.tokenIn ?? ""),
            amountIn: (l.args?.amountIn ?? 0n) as bigint,
            amountOut: (l.args?.amountOut ?? 0n) as bigint,
            blockNumber: (l.blockNumber ?? 0n) as bigint,
          }))
        );
        setScanning(false);
      } catch {
        if (alive) setScanning(false);
      }
    }
    load();
    timer = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [scanBlocks]);

  // ---------- analisa aktivitas ----------
  const stats = useMemo(() => {
    const A = CONFIG.TOKEN_A.address.toLowerCase();
    const B = CONFIG.TOKEN_B.address.toLowerCase();
    let volA = 0n, volB = 0n, nA = 0, nB = 0;
    for (const e of events) {
      const t = e.tokenIn.toLowerCase();
      if (t === A) {
        volA += e.amountIn;
        nA++;
      } else if (t === B) {
        volB += e.amountIn;
        nB++;
      }
    }
    const total = volA + volB;
    const pctA = total > 0n ? Number((volA * 10000n) / total) / 100 : 0;
    const champion =
      total === 0n ? null : volB > volA ? symB : symA;
    return { volA, volB, nA, nB, total, pctA, champion, count: events.length };
  }, [events, symA, symB]);

  const dev =
    oracle != null && poolPrice != null && poolPrice !== 0
      ? ((oracle - poolPrice) / poolPrice) * 100
      : 0;

  return (
    <div className="view oracle">
      {/* ===== LOCAL ACTIVITY ===== */}
      <section className="box oc-activity">
        <div className="box-top">
          <span className="box-label">Local Activity · token paling aktif</span>
          <span className="box-bal">
            {scanning ? "scan blok ±3.000…" : `${stats.count} swap · blok terakhir ${scanBlocks}`}
          </span>
        </div>

        {stats.count === 0 ? (
          <p className="oracle-empty">
            Belum ada event <b>Swapped</b> di blok terakhir ±3.000. Lakuin 1 swap dulu,
            atau perbesar jendela di bawah.
          </p>
        ) : (
          <>
            <div className="oracle-champion">
              <span className="oc-crown">👑</span>
              <span className="token-chip">
                <img className="token-logo" src={stats.champion === symA ? aLogo : bLogo} alt="" />
                {stats.champion}
              </span>
              <span>paling aktif</span>
            </div>

            <ActivityBar
              logo={aLogo}
              sym={symA}
              vol={stats.volA}
              dec={decA}
              n={stats.nA}
              pct={stats.pctA}
            />
            <ActivityBar
              logo={bLogo}
              sym={symB}
              vol={stats.volB}
              dec={decB}
              n={stats.nB}
              pct={100 - stats.pctA}
            />
            <p className="oracle-hint">
              Basis: volume token yang <b>masuk</b> ke pool (direction tokenIn) dari event{" "}
              <span className="mono">Swapped</span> on-chain. Data di-refresh tiap 6 detik.
            </p>
          </>
        )}

        <div className="oc-actions">
          <select
            className="oc-select"
            value={scanBlocks.toString()}
            onChange={(e) => setScanBlocks(BigInt(e.target.value))}
          >
            {[3000n, 6000n, 12000n, 50000n, 200000n].map((n) => (
              <option key={n.toString()} value={n.toString()}>
                rentang blok: {n.toString()}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ===== ORACLE PRICE ===== */}
      <section className="box oc-oracle">
        <div className="box-top">
          <span className="box-label">Oracle · harga referensi</span>
          <span className="box-bal">
            1 {symA} = <b>{fmt2(oracle ?? 0)} {symB}</b>
          </span>
        </div>

        <div className="oc-grid">
          <OCStat label="Harga pool (on-chain)" value={poolPrice == null ? "-" : fmt2(poolPrice)} note="x·y=k" />
          <OCStat label="Harga oracle (referensi)" value={oracle == null ? "-" : fmt2(oracle)} note="mock feed" />
          <OCStat
            label="Deviasi oracle vs pool"
            value={`${dev >= 0 ? "+" : ""}${fmt2(dev)}%`}
            note={dev === 0 ? "sama" : Math.abs(dev) > 1 ? "besar — peluang arbitrase" : "kecil — arb tipis"}
          />
        </div>

        <Chart data={hist} />

        <p className="oracle-hint">
          Chart = pergerakan harga pool (biru) vs oracle referensi (kuning). Oracle mock
          ini sengaja <b>mean-revert</b> ke harga pool (seperti feed Chainlink yang ditarik
          arbitrase). Token kampus nggak punya feed Chainlink sungguhan — di produksi oracle
          ini diganti data aggregator (mis. Chainlink / Pyth).
        </p>
      </section>
    </div>
  );
}

// ---------- sub komponen ----------
function ActivityBar({
  logo,
  sym,
  vol,
  dec,
  n,
  pct,
}: {
  logo: string;
  sym: string;
  vol: bigint;
  dec: number;
  n: number;
  pct: number;
}) {
  return (
    <div className="ac-bar">
      <div className="ac-row">
        <span className="token-chip">
          <img className="token-logo" src={logo} alt="" />
          {sym}
        </span>
        <span className="ac-vol">{fmtNum(Number(formatUnits(vol, dec)))}</span>
        <span className="ac-tx">{n} tx</span>
      </div>
      <div className="ac-track">
        <div className="ac-fill" style={{ width: `${Math.min(100, pct)}%` }} />
        <span className="ac-pct">{fmt2(pct)}%</span>
      </div>
    </div>
  );
}

function OCStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="oc-stat">
      <span className="oc-label">{label}</span>
      <span className="oc-value mono">{value}</span>
      <span className="oc-note">{note}</span>
    </div>
  );
}

function Chart({ data }: { data: PoolPoint[] }) {
  const W = 320, H = 104, PAD = 8;
  if (data.length < 2) {
    return <div className="oracle-chart-empty">Menunggu data harga… (refresh tiap ~10 detik)</div>;
  }
  const all = data.flatMap((d) => [d.p, d.o]);
  let lo = Math.min(...all), hi = Math.max(...all);
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => (H - PAD) - ((v - lo) / (hi - lo)) * (H - 2 * PAD);
  const path = (key: "p" | "o") =>
    data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const lastP = data[data.length - 1].p;
  const lastO = data[data.length - 1].o;

  return (
    <div className="oc-chart-wrap">
      <svg className="oracle-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={y(lo + (hi - lo) * f)} y2={y(lo + (hi - lo) * f)} className="oc-gridline" />
        ))}
        <polyline className="oc-line oc-line--pool" points={path("p")} />
        <polyline className="oc-line oc-line--oracle" points={path("o")} />
      </svg>
      <div className="oc-legend">
        <span className="oc-lg"><i className="oc-dot oc-dot--pool" />Harga pool</span>
        <span className="oc-lg"><i className="oc-dot oc-dot--oracle" />Oracle ref</span>
        <span className="oc-last mono">P {fmt2(lastP)} · O {fmt2(lastO)}</span>
      </div>
    </div>
  );
}