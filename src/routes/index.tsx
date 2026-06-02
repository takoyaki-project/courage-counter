import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "rejection-log-v1";
const TARGET = 10; // 10回で1件成約想定

const CHEERS = [
  "ナイスチャレンジ！",
  "分母が育ってる！",
  "成約に一歩前進！",
  "その勇気が財産だ！",
  "確率はあなたの味方！",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "断られログ - ナイスチャレンジ！" },
      { name: "description", content: "生保営業マンのためのメンタル維持カウンター。断られるたびに成約確率が上がる。" },
    ],
  }),
  component: Index,
});

function Index() {
  const [count, setCount] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCount(parseInt(saved, 10) || 0);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(count));
  }, [count]);

  const probability = Math.min(100, count * 10);
  const inZone = probability >= 80;

  const handlePress = () => {
    setCount((c) => c + 1);
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    setPulse((p) => p + 1);
    setTimeout(() => setCheer(null), 1800);
  };

  const handleClose = () => {
    setCount(0);
    setCheer("成約おめでとう！リセット完了 🎉");
    setTimeout(() => setCheer(null), 2200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-10 bg-gradient-hero">
      <header className="w-full max-w-md text-center">
        <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Rejection Log</p>
        <h1 className="text-2xl font-bold text-foreground mt-2">断られログ</h1>
        <p className="text-sm text-muted-foreground mt-1">ビルを出たら、ポチッと。</p>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="relative w-64 h-64">
          <ProbabilityRing percent={probability} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground">成約確率</p>
            <p className="text-5xl font-bold text-foreground tabular-nums">
              {probability}
              <span className="text-2xl text-muted-foreground">%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              チャレンジ <span className="text-foreground font-semibold">{count}</span> / {TARGET}
            </p>
          </div>
        </div>

        <div className="h-14 flex items-center justify-center">
          {cheer && (
            <div
              key={pulse}
              className="px-5 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-glow animate-cheer"
            >
              {cheer}
            </div>
          )}
          {!cheer && inZone && (
            <p className="text-sm font-semibold text-primary text-center px-4">
              🔥 分母が貯まった！ドカンと1件、来るゾーン突入！
            </p>
          )}
        </div>

        <button
          onClick={handlePress}
          className="group relative w-56 h-56 rounded-full bg-gradient-button text-primary-foreground font-bold text-xl shadow-button transition-transform active:scale-95 hover:scale-[1.02]"
        >
          <span className="absolute inset-2 rounded-full border-2 border-primary-foreground/20" />
          <span className="relative flex flex-col items-center gap-1">
            <span className="text-3xl">＋1</span>
            <span className="text-sm font-medium opacity-90">断られた！</span>
          </span>
        </button>

        <button
          onClick={handleClose}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          成約した！カウンターをリセット
        </button>
      </main>

      <footer className="text-xs text-muted-foreground text-center max-w-md">
        断りは失敗じゃない。成約への階段。<br />
        個人情報は一切記録されません。
      </footer>
    </div>
  );
}

function ProbabilityRing({ percent }: { percent: number }) {
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg viewBox="0 0 256 256" className="w-full h-full -rotate-90">
      <circle
        cx="128"
        cy="128"
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="14"
      />
      <circle
        cx="128"
        cy="128"
        r={radius}
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
      <defs>
        <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent-foreground)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
