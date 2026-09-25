import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";

import { CONFIG } from "../config";
import { ERC20_ABI, AMM_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";
import Oracle from "./Oracle";

const SEPOLIA = CONFIG.SEPOLIA_CHAIN_ID;
const tokenA = { address: CONFIG.TOKEN_A.address as `0x${string}`, abi: ERC20_ABI } as const;
const tokenB = { address: CONFIG.TOKEN_B.address as `0x${string}`, abi: ERC20_ABI } as const;
const amm = { address: CONFIG.AMM_ADDRESS as `0x${string}`, abi: AMM_ABI } as const;
const HKEY = "ks_hist_v2_" + String(CONFIG.AMM_ADDRESS).toLowerCase();

// ---------- types & helpers ----------
interface HistoryEntry {
  type: "swap" | "add" | "remove";
  hash: string;
  ts: number;
  aLogo: string;
  aAmt: string;
  aSym: string;
  bLogo: string;
  bAmt: string;
  bSym: string;
}

function fmt(raw?: bigint | null, dec?: number | null): string {
  if (raw == null || dec == null) return "-";
  return Number(formatUnits(raw, dec)).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}
function fmtNum(x: number | string): string {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
// rumus x*y=k + fee 0.3% (sama persis dengan contract getAmountOut)
function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const inWithFee = amountIn * 997n;
  return (inWithFee * reserveOut) / (reserveIn * 1000n + inWithFee);
}
function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HKEY) || "[]");
  } catch {
    return [];
  }
}

type CoinItem = {
  id: string;
  name: string;
  type: "img" | "eth" | "btc" | "swap";
  src?: string;
  className: string;
  title: string;
};

const COIN_LIST: CoinItem[] = [
  { id: "c-rzh-1", name: "RZH", type: "img", src: "/renzie-icon.svg", className: "coin-pos-1", title: "Token RZH (Renzie)" },
  { id: "c-ethjkt-1", name: "ETHJKT", type: "img", src: "/ethjkt-logo.png", className: "coin-pos-2", title: "Token ETHJKT" },
  { id: "c-eth", name: "ETH", type: "eth", className: "coin-pos-3", title: "Ethereum Sepolia" },
  { id: "c-btc", name: "BTC", type: "btc", className: "coin-pos-4", title: "Bitcoin" },
  { id: "c-swap", name: "SWAP", type: "swap", className: "coin-pos-5", title: "AMM Smart Swap" },
  { id: "c-rzh-2", name: "RZH", type: "img", src: "/renzie-icon.svg", className: "coin-pos-6", title: "Token RZH" },
  { id: "c-ethjkt-2", name: "ETHJKT", type: "img", src: "/ethjkt-logo.png", className: "coin-pos-7", title: "Token ETHJKT" },
];

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === SEPOLIA;

  const [jumpCounts, setJumpCounts] = useState<Record<string, number>>({});
  function handleCoinBounce(id: string) {
    setJumpCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  const [tab, setTab] = useState<"swap" | "liquidity" | "oracle">("swap");
  const [liqSub, setLiqSub] = useState<"add" | "remove">("add");
  const [logTab, setLogTab] = useState<"log" | "history">("history");
  const [swapDir, setSwapDir] = useState<"AtoB" | "BtoA">("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [removeShares, setRemoveShares] = useState("");
  const [busy, setBusy] = useState<{ key: string; text: string } | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Slippage & Settings
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [customSlippage, setCustomSlippage] = useState<string>("");
  const [showPoolStats, setShowPoolStats] = useState<boolean>(true);

  // Tab sliding indicators
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, ready: false });

  const liqSubRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [liqIndicatorStyle, setLiqIndicatorStyle] = useState({ left: 0, width: 0, ready: false });

  const logTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [logIndicatorStyle, setLogIndicatorStyle] = useState({ left: 0, width: 0, ready: false });

  // Update nav tab indicator
  useEffect(() => {
    function updateIndicator() {
      const el = tabRefs.current[tab];
      if (el) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.clientWidth,
          ready: true,
        });
      }
    }
    updateIndicator();
    const timer = setTimeout(updateIndicator, 60);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [tab]);

  // Update liquidity subtab indicator
  useEffect(() => {
    if (tab !== "liquidity") return;
    function updateLiq() {
      const el = liqSubRefs.current[liqSub];
      if (el) {
        setLiqIndicatorStyle({
          left: el.offsetLeft,
          width: el.clientWidth,
          ready: true,
        });
      }
    }
    updateLiq();
    const timer = setTimeout(updateLiq, 60);
    return () => clearTimeout(timer);
  }, [liqSub, tab]);

  // Update log subtab indicator
  useEffect(() => {
    function updateLog() {
      const el = logTabRefs.current[logTab];
      if (el) {
        setLogIndicatorStyle({
          left: el.offsetLeft,
          width: el.clientWidth,
          ready: true,
        });
      }
    }
    updateLog();
    const timer = setTimeout(updateLog, 60);
    return () => clearTimeout(timer);
  }, [logTab, tab]);

  // Touch swipe gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX < 0) {
        // Swipe left -> next tab
        setTab((curr) => (curr === "swap" ? "liquidity" : curr === "liquidity" ? "oracle" : "oracle"));
      } else {
        // Swipe right -> prev tab
        setTab((curr) => (curr === "oracle" ? "liquidity" : curr === "liquidity" ? "swap" : "swap"));
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  // ---------- reads ----------
  const pool = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "symbol" },
      { ...tokenA, functionName: "decimals" },
      { ...tokenB, functionName: "symbol" },
      { ...tokenB, functionName: "decimals" },
      { ...amm, functionName: "reserveA" },
      { ...amm, functionName: "reserveB" },
      { ...amm, functionName: "totalShares" },
    ],
    query: { refetchInterval: 10000 },
  });
  const user = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "balanceOf", args: [address as `0x${string}`] },
      { ...tokenB, functionName: "balanceOf", args: [address as `0x${string}`] },
      { ...amm, functionName: "shares", args: [address as `0x${string}`] },
    ],
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const userAllowance = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "allowance", args: [address as `0x${string}`, CONFIG.AMM_ADDRESS] },
      { ...tokenB, functionName: "allowance", args: [address as `0x${string}`, CONFIG.AMM_ADDRESS] },
    ],
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const d = pool.data;
  const symA = d?.[0]?.result ?? "TOKEN A";
  const decA = d?.[1]?.result;
  const symB = d?.[2]?.result ?? "TOKEN B";
  const decB = d?.[3]?.result;
  const reserveA = d?.[4]?.result ?? 0n;
  const reserveB = d?.[5]?.result ?? 0n;
  const totalShares = d?.[6]?.result ?? 0n;

  const balA = user.data?.[0]?.result;
  const balB = user.data?.[1]?.result;
  const myShares = user.data?.[2]?.result;

  const allowA = userAllowance.data?.[0]?.result ?? 0n;
  const allowB = userAllowance.data?.[1]?.result ?? 0n;

  const ready = isConnected && chainOk && decA != null && decB != null;
  const hasPool = reserveA > 0n && reserveB > 0n;

  function refresh() {
    pool.refetch();
    user.refetch();
    userAllowance.refetch();
  }
  function log(msg: string) {
    const t = new Date().toLocaleTimeString();
    setLogLines((prev) => [`[${t}] ${msg}`, ...prev].slice(0, 40));
  }
  function pushHistory(entry: HistoryEntry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(HKEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setLogTab("history");
  }

  // Active token pair pointers
  const fromSym = swapDir === "AtoB" ? symA : symB;
  const toSym = swapDir === "AtoB" ? symB : symA;
  const fromLogo = swapDir === "AtoB" ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo;
  const toLogo = swapDir === "AtoB" ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo;
  const curBalIn = swapDir === "AtoB" ? balA : balB;
  const curDecIn = swapDir === "AtoB" ? decA : decB;
  const curBalOut = swapDir === "AtoB" ? balB : balA;
  const curDecOut = swapDir === "AtoB" ? decB : decA;
  const curAllowIn = swapDir === "AtoB" ? allowA : allowB;
  const curTokenIn = swapDir === "AtoB" ? tokenA : tokenB;

  // ---------- swap preview & metrics ----------
  const previewOut = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || decA == null || decB == null) return "";
    try {
      if (swapDir === "AtoB") {
        const out = getAmountOut(parseUnits(amountIn, decA), reserveA, reserveB);
        return fmt(out, decB);
      }
      const out = getAmountOut(parseUnits(amountIn, decB), reserveB, reserveA);
      return fmt(out, decA);
    } catch {
      return "";
    }
  }, [amountIn, swapDir, reserveA, reserveB, decA, decB]);

  const minOutStr = useMemo(() => {
    if (!previewOut || Number(previewOut) <= 0) return "-";
    const val = Number(previewOut) * (1 - slippage / 100);
    return fmtNum(Math.max(0, val));
  }, [previewOut, slippage]);

  const swapRate = useMemo(() => {
    if (!reserveA || !reserveB || decA == null || decB == null || reserveA === 0n || reserveB === 0n) return null;
    const rA = Number(formatUnits(reserveA, decA));
    const rB = Number(formatUnits(reserveB, decB));
    if (rA <= 0 || rB <= 0) return null;
    return swapDir === "AtoB" ? rB / rA : rA / rB;
  }, [reserveA, reserveB, decA, decB, swapDir]);

  const priceImpact = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || !reserveA || !reserveB || decA == null || decB == null) return 0;
    const amt = Number(amountIn);
    const rIn = swapDir === "AtoB" ? Number(formatUnits(reserveA, decA)) : Number(formatUnits(reserveB, decB));
    if (rIn <= 0) return 0;
    return (amt / (rIn + amt)) * 100;
  }, [amountIn, reserveA, reserveB, decA, decB, swapDir]);

  // Check 2-step approval requirements
  const parsedAmountIn = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || curDecIn == null) return 0n;
    try {
      return parseUnits(amountIn, curDecIn);
    } catch {
      return 0n;
    }
  }, [amountIn, curDecIn]);

  const needsApproval = ready && parsedAmountIn > 0n && curAllowIn < parsedAmountIn;

  // ---------- liquidity auto-pair ----------
  function onAddA(v: string) {
    setAddA(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtA = parseUnits(v, decA);
        const amtB = (amtA * reserveB) / reserveA;
        setAddB(trim(formatUnits(amtB, decB)));
      } catch {}
    } else if (!v) setAddB("");
  }
  function onAddB(v: string) {
    setAddB(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtB = parseUnits(v, decB);
        const amtA = (amtB * reserveA) / reserveB;
        setAddA(trim(formatUnits(amtA, decA)));
      } catch {}
    } else if (!v) setAddA("");
  }

  function setPercentAmount(pct: number) {
    if (curBalIn == null || curDecIn == null || curBalIn === 0n) return;
    if (pct === 100) {
      setAmountIn(formatUnits(curBalIn, curDecIn));
      return;
    }
    const val = (curBalIn * BigInt(pct)) / 100n;
    setAmountIn(trim(formatUnits(val, curDecIn)));
  }

  function setPercentAddA(pct: number) {
    if (balA == null || decA == null || balA === 0n) return;
    const val = pct === 100 ? balA : (balA * BigInt(pct)) / 100n;
    onAddA(pct === 100 ? formatUnits(balA, decA) : trim(formatUnits(val, decA)));
  }

  // ---------- write flows ----------
  async function ensureAllowance(
    token: { address: `0x${string}`; abi: any },
    amount: bigint,
    sym: string,
    setStep: (t: string) => void
  ) {
    if (!address) return;
    const cur = await readContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address, CONFIG.AMM_ADDRESS],
    });
    if (cur >= amount) return;
    setStep(`Approve ${sym} - cek MetaMask`);
    log(`Approve ${sym}... konfirmasi di wallet`);
    const hash = await writeContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.AMM_ADDRESS, amount],
    });
    setStep(`Approve ${sym} terkirim, nunggu…`);
    await waitForTransactionReceipt(wagmiConfig, { hash });
    log(`Approve ${sym} sukses.`);
    userAllowance.refetch();
  }

  async function doApprove() {
    if (!guard()) return;
    if (parsedAmountIn <= 0n || curDecIn == null) return;
    const setStep = (t: string) => setBusy({ key: "approve", text: t });
    setStep(`Konfirmasi Approve ${fromSym} di MetaMask`);
    log(`Approve ${fromSym}... konfirmasi di wallet`);
    try {
      const hash = await writeContract(wagmiConfig, {
        address: curTokenIn.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONFIG.AMM_ADDRESS, parsedAmountIn],
      });
      setStep(`Approve ${fromSym} sedang diproses...`);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log(`Approve ${fromSym} sukses!`);
      userAllowance.refetch();
    } catch (e) {
      log(`Approve ${fromSym} gagal: ` + short(e));
    } finally {
      setBusy(null);
    }
  }

  async function doSwap() {
    if (!guard()) return;
    if (!amountIn || Number(amountIn) <= 0) return alert("Isi jumlah swap dulu.");
    if (decA == null || decB == null) return alert("Menunggu data token...");
    const inSym = swapDir === "AtoB" ? symA : symB;
    const outSym = swapDir === "AtoB" ? symB : symA;
    const inDec = swapDir === "AtoB" ? decA : decB;
    const outDec = swapDir === "AtoB" ? decB : decA;
    const rIn = swapDir === "AtoB" ? reserveA : reserveB;
    const rOut = swapDir === "AtoB" ? reserveB : reserveA;
    const token = swapDir === "AtoB" ? tokenA : tokenB;
    const amount = parseUnits(amountIn, inDec);
    const setStep = (t: string) => setBusy({ key: "swap", text: t });
    setStep("...");
    try {
      await ensureAllowance(token, amount, inSym, setStep);
      setStep("Konfirmasi swap di MetaMask");
      log("Kirim swap... konfirmasi di wallet");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS,
        abi: AMM_ABI,
        functionName: swapDir === "AtoB" ? "swapAforB" : "swapBforA",
        args: [amount],
      });
      setStep("Menukar… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      const outRaw = getAmountOut(amount, rIn, rOut);
      const amtIn = Number(amountIn);
      const amtOut = Number(formatUnits(outRaw, outDec));
      log("Swap sukses!");
      pushHistory({
        type: "swap", hash, ts: Date.now(),
        aLogo: swapDir === "AtoB" ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo,
        aAmt: fmtNum(amtIn), aSym: inSym,
        bLogo: swapDir === "AtoB" ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo,
        bAmt: fmtNum(amtOut), bSym: outSym,
      });
      setAmountIn("");
      refresh();
    } catch (e) {
      log("Swap gagal: " + short(e));
    } finally {
      setBusy(null);
    }
  }

  async function doAddLiquidity() {
    if (!guard()) return;
    if (!addA || !addB || Number(addA) <= 0 || Number(addB) <= 0) return alert("Isi jumlah A & B dulu.");
    if (decA == null || decB == null) return alert("Menunggu data token...");
    const amtA = parseUnits(addA, decA);
    const amtB = parseUnits(addB, decB);
    const setStep = (t: string) => setBusy({ key: "add", text: t });
    setStep("...");
    try {
      await ensureAllowance(tokenA, amtA, symA, setStep);
      await ensureAllowance(tokenB, amtB, symB, setStep);
      setStep("Konfirmasi tambah di MetaMask");
      log("Kirim addLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS, abi: AMM_ABI,
        functionName: "addLiquidity", args: [amtA, amtB],
      });
      setStep("Menambah… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log("Tambah likuiditas sukses!");
      pushHistory({
        type: "add", hash, ts: Date.now(),
        aLogo: CONFIG.TOKEN_A.logo, aAmt: fmtNum(Number(addA)), aSym: symA,
        bLogo: CONFIG.TOKEN_B.logo, bAmt: fmtNum(Number(addB)), bSym: symB,
      });
      setAddA("");
      setAddB("");
      refresh();
    } catch (e) {
      log("Tambah gagal: " + short(e));
    } finally {
      setBusy(null);
    }
  }

  async function doRemoveLiquidity() {
    if (!guard()) return;
    if (!removeShares || Number(removeShares) <= 0) return alert("Isi jumlah share dulu.");
    const setStep = (t: string) => setBusy({ key: "remove", text: t });
    setStep("Konfirmasi tarik di MetaMask");
    try {
      log("Kirim removeLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS, abi: AMM_ABI,
        functionName: "removeLiquidity", args: [parseUnits(removeShares, 18)],
      });
      setStep("Menarik… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log("Tarik likuiditas sukses!");
      pushHistory({
        type: "remove", hash, ts: Date.now(),
        aLogo: CONFIG.TOKEN_A.logo, aAmt: "", aSym: symA,
        bLogo: CONFIG.TOKEN_B.logo, bAmt: "", bSym: symB,
      });
      setRemoveShares("");
      refresh();
    } catch (e) {
      log("Tarik gagal: " + short(e));
    } finally {
      setBusy(null);
    }
  }

  function guard() {
    if (!isConnected) { alert("Connect wallet dulu."); return false; }
    if (!chainOk) { alert("Pindah ke Sepolia dulu (lewat tombol wallet)."); return false; }
    return true;
  }

  const actLabel = !isConnected ? "Connect Wallet" : !chainOk ? "Jaringan Salah" : null;

  const renderHistoryLog = () => (
    <Glass className="card">
      <div className="subtabs logtabs">
        {logIndicatorStyle.ready && (
          <span
            className="subtab-indicator"
            style={{
              transform: `translateX(${logIndicatorStyle.left}px)`,
              width: `${logIndicatorStyle.width}px`,
            }}
          />
        )}
        <button
          ref={(el) => { logTabRefs.current["history"] = el; }}
          type="button"
          className={`subtab ${logTab === "history" ? "subtab--active" : ""}`}
          onClick={() => setLogTab("history")}
        >
          Riwayat Transaksi
        </button>
        <button
          ref={(el) => { logTabRefs.current["log"] = el; }}
          type="button"
          className={`subtab ${logTab === "log" ? "subtab--active" : ""}`}
          onClick={() => setLogTab("log")}
        >
          Log Konsol
        </button>
      </div>
      {logTab === "log" ? (
        <pre key="log-console" className="log tab-pane-animated">{logLines.length ? logLines.join("\n") : "Belum ada aktivitas."}</pre>
      ) : (
        <div key="log-history" className="history tab-pane-animated">
          {history.length === 0 ? (
            <p className="hist-empty">Belum ada riwayat transaksi.</p>
          ) : (
            history.map((h, i) => <HistRow key={i} h={h} />)
          )}
        </div>
      )}
    </Glass>
  );

  return (
    <>
      {/* ===== LIQUID AURORA GLOW & HOLOGRAPHIC 3D COINS ===== */}
      <div className="aurora-container">
        <div className="aurora-orb aurora-orb-1" aria-hidden="true" />
        <div className="aurora-orb aurora-orb-2" aria-hidden="true" />
        <div className="aurora-orb aurora-orb-3" aria-hidden="true" />
        <div className="aurora-orb aurora-orb-4" aria-hidden="true" />
        <div className="aurora-dust" aria-hidden="true" />

        {/* Floating Interactive 3D Coins */}
        <div className="coins-layer">
          {COIN_LIST.map((c) => {
            const jumps = jumpCounts[c.id] || 0;
            return (
              <button
                key={c.id}
                type="button"
                className={`coin-3d ${c.className}`}
                title={`Klik untuk memutar token ${c.name}!`}
                onClick={() => handleCoinBounce(c.id)}
              >
                <div key={jumps} className={`coin-inner ${jumps > 0 ? "coin-jump-active" : ""}`}>
                  <span className="coin-specular" />
                  {c.type === "img" && <img src={c.src} alt={c.name} className="coin-icon-img" />}
                  {c.type === "eth" && (
                    <svg viewBox="0 0 32 32" className="coin-svg" fill="none">
                      <path d="M16 3 L7 16.5 L16 21 L25 16.5 Z" fill="#38bdf8" />
                      <path d="M16 3 L16 21 L25 16.5 Z" fill="#0284c7" />
                      <path d="M16 22.5 L7 18 L16 29 L25 18 Z" fill="#38bdf8" />
                      <path d="M16 22.5 L16 29 L25 18 Z" fill="#0369a1" />
                    </svg>
                  )}
                  {c.type === "btc" && (
                    <svg viewBox="0 0 32 32" className="coin-svg" fill="none">
                      <circle cx="16" cy="16" r="13" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
                      <path d="M17.5 7v2m3 0v-2m-5.5 13v2m3-2v2m-3-13h4a3 3 0 0 1 2.5 4.6A3.5 3.5 0 0 1 20 20h-5.5V9zm0 5h4a1.5 1.5 0 0 0 0-3h-4v3zm0 4h4.5a1.5 1.5 0 0 0 0-3H14.5v3z" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {c.type === "swap" && (
                    <svg viewBox="0 0 32 32" className="coin-svg" fill="none">
                      <circle cx="16" cy="16" r="13" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
                      <path d="M8 12h14l-3.5-3.5m5.5 11.5H10l3.5 3.5" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="page">
      {/* ===== UNIFIED FLOATING HEADER DOCK ===== */}
      <header className="head">
        <div className="brand">
          <img className="brand-logo" src={CONFIG.BRAND_LOGO} alt="RENZIE TRADE" />
          <span className="brand-title">RENZIE <span className="highlight-trade">TRADE</span></span>
        </div>

        {/* Central Navigation Tabs with Smooth Sliding Pill */}
        <nav className="nav-tabs">
          {indicatorStyle.ready && (
            <span
              className="tab-indicator"
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          )}
          <button
            ref={(el) => { tabRefs.current["swap"] = el; }}
            type="button"
            className={`tab-btn ${tab === "swap" ? "tab-btn--active" : ""}`}
            onClick={() => setTab("swap")}
          >
            Swap
          </button>
          <button
            ref={(el) => { tabRefs.current["liquidity"] = el; }}
            type="button"
            className={`tab-btn ${tab === "liquidity" ? "tab-btn--active" : ""}`}
            onClick={() => setTab("liquidity")}
          >
            Liquidity
          </button>
          <button
            ref={(el) => { tabRefs.current["oracle"] = el; }}
            type="button"
            className={`tab-btn ${tab === "oracle" ? "tab-btn--active" : ""}`}
            onClick={() => setTab("oracle")}
          >
            Oracle
          </button>
        </nav>

        <div className="head-actions">
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </header>

      {/* ===== CENTERED MAIN CONSOLE WITH SWIPE GESTURES ===== */}
      <main
        className="dex-layout"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tab === "oracle" ? (
          <div key="oracle-pane" className="dex-card-wrapper dex-card-wrapper--wide tab-pane-animated">
            <Glass className="card main">
              <Oracle
                reserveA={reserveA}
                reserveB={reserveB}
                decA={Number(decA)}
                decB={Number(decB)}
                symA={symA}
                symB={symB}
                aLogo={CONFIG.TOKEN_A.logo}
                bLogo={CONFIG.TOKEN_B.logo}
              />
            </Glass>
            {renderHistoryLog()}
          </div>
        ) : (
          <div key="swap-pool-grid" className="dex-deck-2col tab-pane-animated">
            {/* Left Column: Swap Token or Kolam Likuiditas */}
            <div className="dex-card-wrapper">
              <Glass className="card main">
              {/* Card Header with Gear Settings */}
              <div className="card-head">
                <h2 className="card-title">{tab === "swap" ? "Swap Token" : "Kolam Likuiditas"}</h2>
                {tab === "swap" && (
                  <button
                    type="button"
                    className={`gear-btn ${showSettings ? "gear-btn--active" : ""}`}
                    title="Pengaturan Toleransi Slippage"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    ⚙
                  </button>
                )}
              </div>

              {/* Slippage Settings Panel */}
              {tab === "swap" && showSettings && (
                <div className="settings-panel">
                  <div className="settings-title">
                    <span>Toleransi Slippage</span>
                    <span className="mono">{slippage}%</span>
                  </div>
                  <div className="slippage-options">
                    {[0.1, 0.5, 1.0].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`slip-btn ${slippage === s && !customSlippage ? "slip-btn--active" : ""}`}
                        onClick={() => { setSlippage(s); setCustomSlippage(""); }}
                      >
                        {s}%
                      </button>
                    ))}
                    <div className="slip-custom">
                      <input
                        type="number"
                        step="0.1"
                        min="0.01"
                        max="50"
                        placeholder="Custom"
                        className="slip-input"
                        value={customSlippage}
                        onChange={(e) => {
                          setCustomSlippage(e.target.value);
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0 && val <= 50) setSlippage(val);
                        }}
                      />
                      <span className="slip-pct">%</span>
                    </div>
                  </div>
                  <p className="settings-hint">Transaksi batal bila perubahan harga melampaui persentase ini.</p>
                </div>
              )}

              {tab === "swap" ? (
                <div key="swap-pane" className="view tab-pane-animated">
                  {/* BOX 1: PAY */}
                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Kamu bayar</span>
                      <span className="box-bal">
                        Saldo: {curBalIn != null && curDecIn != null ? fmt(curBalIn, curDecIn) : "0"} {fromSym}
                        <button type="button" className="max-badge" onClick={() => setPercentAmount(100)}>MAX</button>
                      </span>
                    </div>
                    <div className="box-mid">
                      <input
                        type="number"
                        min="0"
                        placeholder="0.0"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                      />
                      <span className="token-chip">
                        <img className="token-logo" src={fromLogo} alt="" />
                        {fromSym}
                      </span>
                    </div>
                    <div className="quick-pct-row">
                      <button type="button" className="pct-btn" onClick={() => setPercentAmount(25)}>25%</button>
                      <button type="button" className="pct-btn" onClick={() => setPercentAmount(50)}>50%</button>
                      <button type="button" className="pct-btn" onClick={() => setPercentAmount(75)}>75%</button>
                      <button type="button" className="pct-btn" onClick={() => setPercentAmount(100)}>100%</button>
                    </div>
                  </div>

                  {/* FLIP BUTTON */}
                  <div className="flip-wrapper">
                    <button
                      type="button"
                      className="flip"
                      title="Balik arah tukar"
                      onClick={() => setSwapDir(swapDir === "AtoB" ? "BtoA" : "AtoB")}
                    >
                      ⇅
                    </button>
                  </div>

                  {/* BOX 2: RECEIVE */}
                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Kamu terima (perkiraan)</span>
                      <span className="box-bal">
                        Saldo: {curBalOut != null && curDecOut != null ? fmt(curBalOut, curDecOut) : "0"} {toSym}
                      </span>
                    </div>
                    <div className="box-mid">
                      <input type="text" readOnly placeholder="0.0" value={previewOut} />
                      <span className="token-chip">
                        <img className="token-logo" src={toLogo} alt="" />
                        {toSym}
                      </span>
                    </div>
                  </div>

                  {/* 2-STEP ACTION TRACKER */}
                  {ready && parsedAmountIn > 0n && (
                    <div className="stepper-2step">
                      <div className={`step-item ${needsApproval ? "step-item--active" : "step-item--done"}`}>
                        <span className="step-num">{needsApproval ? "1" : "✓"}</span>
                        <span className="step-text">{needsApproval ? `Approve ${fromSym}` : `${fromSym} Disetujui`}</span>
                      </div>
                      <div className={`step-line ${!needsApproval ? "step-line--done" : ""}`} />
                      <div className={`step-item ${!needsApproval ? "step-item--active" : "step-item--pending"}`}>
                        <span className="step-num">2</span>
                        <span className="step-text">Eksekusi Swap</span>
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="actions">
                    {needsApproval ? (
                      <button
                        type="button"
                        className="act act--primary"
                        disabled={!ready || busy != null}
                        onClick={doApprove}
                      >
                        {busy?.key === "approve" ? <><span className="spinner" />{busy.text}</> : `Approve ${fromSym}`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="act act--primary"
                        disabled={!ready || !amountIn || Number(amountIn) <= 0 || busy != null}
                        onClick={doSwap}
                      >
                        {busy?.key === "swap" ? <><span className="spinner" />{busy.text}</> : actLabel || "Swap"}
                      </button>
                    )}
                  </div>

                  {/* SWAP METRICS BREAKDOWN */}
                  {amountIn && Number(amountIn) > 0 && previewOut && (
                    <div className="swap-breakdown">
                      <div className="swap-breakdown-row">
                        <span className="swap-breakdown-label">Nilai Tukar Pasar</span>
                        <span className="swap-breakdown-val mono">1 {fromSym} ≈ {swapRate ? fmtNum(swapRate) : "-"} {toSym}</span>
                      </div>
                      <div className="swap-breakdown-row">
                        <span className="swap-breakdown-label">Minimum Diterima</span>
                        <span className="swap-breakdown-val mono">{minOutStr} {toSym}</span>
                      </div>
                      <div className="swap-breakdown-row">
                        <span className="swap-breakdown-label">Toleransi Slippage</span>
                        <span className="swap-breakdown-val mono">{slippage}%</span>
                      </div>
                      <div className="swap-breakdown-row">
                        <span className="swap-breakdown-label">Biaya Likuiditas (0.3% LP)</span>
                        <span className="swap-breakdown-val mono">{fmtNum(Number(amountIn) * 0.003)} {fromSym}</span>
                      </div>
                      <div className="swap-breakdown-row">
                        <span className="swap-breakdown-label">Estimasi Price Impact</span>
                        <span className={`swap-breakdown-val mono ${priceImpact > 5 ? "impact-warn" : "impact-ok"}`}>
                          {fmtNum(priceImpact)}% {priceImpact > 5 ? "⚠️ Tinggi" : "✓ Seimbang"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* LIQUIDITY VIEW */
                <div key="liquidity-pane" className="view tab-pane-animated">
                  <div className="subtabs">
                    {liqIndicatorStyle.ready && (
                      <span
                        className="subtab-indicator"
                        style={{
                          transform: `translateX(${liqIndicatorStyle.left}px)`,
                          width: `${liqIndicatorStyle.width}px`,
                        }}
                      />
                    )}
                    <button
                      ref={(el) => { liqSubRefs.current["add"] = el; }}
                      type="button"
                      className={`subtab ${liqSub === "add" ? "subtab--active" : ""}`}
                      onClick={() => setLiqSub("add")}
                    >
                      Tambah
                    </button>
                    <button
                      ref={(el) => { liqSubRefs.current["remove"] = el; }}
                      type="button"
                      className={`subtab ${liqSub === "remove" ? "subtab--active" : ""}`}
                      onClick={() => setLiqSub("remove")}
                    >
                      Tarik
                    </button>
                  </div>

                  {liqSub === "add" ? (
                    <div key="liq-add-pane" className="view tab-pane-animated">
                      <div className="box">
                        <div className="box-top">
                          <span className="box-label">Setor Token A</span>
                          <span className="box-bal">
                            Saldo: {fmt(balA, decA)} {symA}
                            <button type="button" className="max-badge" onClick={() => setPercentAddA(100)}>MAX</button>
                          </span>
                        </div>
                        <div className="box-mid">
                          <input type="number" min="0" placeholder="0.0" value={addA} onChange={(e) => onAddA(e.target.value)} />
                          <span className="token-chip"><img className="token-logo" src={CONFIG.TOKEN_A.logo} alt="" />{symA}</span>
                        </div>
                        <div className="quick-pct-row">
                          <button type="button" className="pct-btn" onClick={() => setPercentAddA(25)}>25%</button>
                          <button type="button" className="pct-btn" onClick={() => setPercentAddA(50)}>50%</button>
                          <button type="button" className="pct-btn" onClick={() => setPercentAddA(75)}>75%</button>
                          <button type="button" className="pct-btn" onClick={() => setPercentAddA(100)}>100%</button>
                        </div>
                      </div>

                      <div className="flip-wrapper">
                        <div className="flip flip--plus">+</div>
                      </div>

                      <div className="box">
                        <div className="box-top">
                          <span className="box-label">Setor Token B (Auto-Pair)</span>
                          <span className="box-bal">Saldo: {fmt(balB, decB)} {symB}</span>
                        </div>
                        <div className="box-mid">
                          <input type="number" min="0" placeholder="0.0" value={addB} onChange={(e) => onAddB(e.target.value)} />
                          <span className="token-chip"><img className="token-logo" src={CONFIG.TOKEN_B.logo} alt="" />{symB}</span>
                        </div>
                      </div>

                      <p className="hint">
                        {hasPool ? "Isi salah satu, token kedua otomatis dihitung sesuai rasio pool." : "Pool baru: Anda bebas menentukan rasio harga perdana."}
                      </p>

                      <div className="actions">
                        <button className="act act--primary" disabled={!ready || busy?.key === "add"} onClick={doAddLiquidity}>
                          {busy?.key === "add" ? <><span className="spinner" />{busy.text}</> : actLabel || "Tambah Likuiditas"}
                        </button>
                      </div>

                      <div className="swap-breakdown">
                        <div className="swap-breakdown-row">
                          <span className="swap-breakdown-label">Rasio Kolam Likuiditas</span>
                          <span className="swap-breakdown-val mono">
                            1 {symA} ≈ {reserveA > 0n && reserveB > 0n && decA != null && decB != null ? fmtNum(Number(formatUnits(reserveB, decB)) / Number(formatUnits(reserveA, decA))) : "-"} {symB}
                          </span>
                        </div>
                        <div className="swap-breakdown-row">
                          <span className="swap-breakdown-label">Imbal Hasil Penyedia Likuiditas</span>
                          <span className="swap-breakdown-val mono">0.3% dari setiap volume swap</span>
                        </div>
                        <div className="swap-breakdown-row">
                          <span className="swap-breakdown-label">Bukti Saham</span>
                          <span className="swap-breakdown-val mono">Mencetak LP Shares ke dompet</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* REMOVE LIQUIDITY */
                    <div key="liq-remove-pane" className="view tab-pane-animated">
                      <div className="box">
                        <div className="box-top">
                          <span className="box-label">Share yang Ditarik</span>
                          <span className="box-bal">
                            Punya: {fmt(myShares, 18)}
                            <button
                              type="button"
                              className="max-badge"
                              onClick={() => myShares != null && setRemoveShares(formatUnits(myShares, 18))}
                            >
                              MAX
                            </button>
                          </span>
                        </div>
                        <div className="box-mid">
                          <input type="number" min="0" placeholder="0.0" value={removeShares} onChange={(e) => setRemoveShares(e.target.value)} />
                          <span className="token-chip">LP Shares</span>
                        </div>
                      </div>
                      <div className="actions">
                        <button className="act act--primary" disabled={!ready || busy?.key === "remove"} onClick={doRemoveLiquidity}>
                          {busy?.key === "remove" ? <><span className="spinner" />{busy.text}</> : actLabel || "Tarik Likuiditas"}
                        </button>
                      </div>

                      <div className="swap-breakdown">
                        <div className="swap-breakdown-row">
                          <span className="swap-breakdown-label">Mekanisme Penarikan</span>
                          <span className="swap-breakdown-val mono">Burn Shares ➔ Terima Pokok + Akumulasi Fee</span>
                        </div>
                        <div className="swap-breakdown-row">
                          <span className="swap-breakdown-label">Porsi Kepemilikan Anda</span>
                          <span className="swap-breakdown-val mono">
                            {totalShares > 0n && myShares != null ? fmtNum((Number(myShares) / Number(totalShares)) * 100) : "0"}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Glass>
          </div>

          {/* Right Column: Beside Swap Token / Kolam Likuiditas */}
          <div className="dex-side-wrapper">
            {/* COLLAPSIBLE POOL RESERVES & BALANCES */}
            <Glass className="card pool-accordion">
              <button
                type="button"
                className="accordion-toggle"
                onClick={() => setShowPoolStats(!showPoolStats)}
              >
                <span className="accordion-label">📊 Cadangan Pool & Saldo Dompet</span>
                <span className="accordion-arrow">{showPoolStats ? "▲" : "▼"}</span>
              </button>
              {showPoolStats && (
                <div className="accordion-body">
                  <Row k={`Saldo ${symA}`} v={fmt(balA, decA)} />
                  <Row k={`Saldo ${symB}`} v={fmt(balB, decB)} />
                  <div className="hr" />
                  <Row k={`Cadangan Pool ${symA}`} v={fmt(reserveA, decA)} />
                  <Row k={`Cadangan Pool ${symB}`} v={fmt(reserveB, decB)} />
                  <Row k="Rasio Pasar" v={`1 ${symA} ≈ ${swapRate ? fmtNum(swapRate) : "-"} ${symB}`} />
                  <Row k="Share kamu / total" v={`${fmt(myShares, 18)} / ${fmt(totalShares, 18)}`} />
                </div>
              )}
            </Glass>

            {/* LOG & HISTORY SECTION */}
            {renderHistoryLog()}
          </div>
        </div>
      )}
    </main>
  </div>
</>
  );
}

// ---------- small components ----------
function Glass({ className = "", inner = "col-inner", children }: { className?: string; inner?: string; children: ReactNode }) {
  return (
    <section className={`glass ${className}`}>
      <span className="glass-filter" /><span className="glass-overlay" /><span className="glass-specular" />
      <div className={`glass-content ${inner}`}>{children}</div>
    </section>
  );
}
function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="row"><span className="k">{k}</span><span className="v mono">{v}</span></div>
  );
}
function HistRow({ h }: { h: HistoryEntry }) {
  const url = h.hash ? "https://sepolia.etherscan.io/tx/" + h.hash : "#";
  const dt = h.ts ? new Date(h.ts) : null;
  const date = dt ? dt.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
  const time = dt ? dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
  const mid = h.type === "swap" ? "→" : h.type === "remove" ? "↑" : "+";
  const via = h.type === "swap" ? "Swap" : h.type === "remove" ? "Tarik LP" : "Tambah LP";
  return (
    <div className="hist-row">
      <span className="hist-token"><img className="hist-logo" src={h.aLogo} alt="" /><span className="hist-amt">{h.aAmt} {h.aSym}</span></span>
      <span className="hist-arrow">{mid}</span>
      <span className="hist-token"><img className="hist-logo" src={h.bLogo} alt="" /><span className="hist-amt">{h.bAmt} {h.bSym}</span></span>
      <span className="hist-via"><span className="hist-via-top">via <b>RENZIE TRADE</b></span><span className="hist-sub2">{via}</span></span>
      <a className="hist-date" href={url} target="_blank" rel="noopener noreferrer">
        <span className="hist-d">{date} ↗</span>
        <span className="hist-t">{time}</span>
      </a>
      <span className="hist-check">✓</span>
    </div>
  );
}

// ---------- utils ----------
function trim(s: string): string {
  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6);
}
function short(e: any): string {
  return e?.shortMessage || e?.message || String(e);
}
