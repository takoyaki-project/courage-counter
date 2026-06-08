import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "rejection-log-v1";
const TARGET = 10; // 10回で1件成約想定

const CHEERS = [
  // 偉人・漫画の名言風
  "諦めたらそこで試合終了だよ",
  "鳴かぬなら、次に行こうホトトギス（信長風）",
  "敵は本能寺にあらず、次のビルにあり",
  "為せば成る、為さねば成らぬ何事も",
  "我以外皆我師。今の断りも学び",
  "明日死ぬかのように生きよ、永遠に生きるかのように学べ",
  "海賊王に、俺はなる！…の前に1件取る！",
  // 体育会系・熱血先輩風
  "ナイスチャレンジ！今の断られ方、次に繋がるいいスイングだ！",
  "断られてからが本番！今の1件で成約に一歩近づいた！",
  "今の1件で経験値ゲット！レベルアップだ！",
  "声出していこう！次のドアを叩け！",
  "汗かいた数だけ契約は近づく！",
  "ファイト！お前の足は何のためにある！",
  // クスッと笑える労い風
  "お疲れ様！あそこの社長は今日、機嫌が悪かっただけ！",
  "とりあえず、自販機で美味い缶コーヒーでも飲んでリセットしよ！",
  "受付のお姉さんの塩対応も、芸のうち",
  "断りはタダ。ノーリスク・ハイ経験値！",
  "今日のあなた、靴底すり減らし選手権 優勝！",
  "断られた数 = 行動した証。胸を張れ！",
  // 確率論
  "分母が育ってる！確率はあなたの味方！",
  "ノーカウントの神様なんていない。全部前進！",
  "成約までの距離、また1歩縮まった！",
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
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showFullResetDialog, setShowFullResetDialog] = useState(false);

  const loadCount = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) setCount(parsed);
      }
    } catch {
      // private mode などで localStorage が使えない場合は無視
    }
  };

  const saveCount = (value: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // private mode などでは無視（インメモリのみ）
    }
  };

  useEffect(() => {
    loadCount();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const parsed = parseInt(e.newValue || "0", 10);
        if (!isNaN(parsed)) setCount(parsed);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    saveCount(count);
  }, [count]);

  const probability = Math.min(100, count * 10);
  const inZone = probability >= 80;

  const handlePress = () => {
    setCount((c) => c + 1);
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    setPulse((p) => p + 1);
    setTimeout(() => setCheer(null), 6000);
  };

  const confirmReset = () => {
    setShowResetDialog(true);
  };

  const doReset = () => {
    setCount(0);
    setShowResetDialog(false);
    setCheer("成約おめでとう！リセット完了 🎉");
    setTimeout(() => setCheer(null), 2200);
  };

  const cancelReset = () => {
    setShowResetDialog(false);
  };

  const doFullReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCount(0);
    setShowFullResetDialog(false);
    setCheer("完全リセット完了。さあ、ゼロから！");
    setTimeout(() => setCheer(null), 2200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 pt-4 pb-24 bg-gradient-hero relative gap-4">
      <header className="w-full max-w-md text-center">
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Rejection Log</p>
        <h1 className="text-4xl font-extrabold text-foreground mt-1 tracking-tight">断られログ</h1>
        <p className="text-base font-semibold text-foreground/80 mt-1">ビルを出たら、ポチッと。</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
          10回声をかけて、3回話を聞いてもらえて、1件成約する。
        </p>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="relative w-40 h-40">
          <ProbabilityRing percent={probability} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground">成約確率</p>
            <p className="text-4xl font-bold text-foreground tabular-nums leading-none mt-0.5">
              {probability}
              <span className="text-xl text-muted-foreground">%</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              チャレンジ <span className="text-foreground font-semibold">{count}</span> / {TARGET}
            </p>
          </div>
        </div>

        <button
          onClick={handlePress}
          className="group relative w-44 h-44 rounded-full bg-gradient-button text-primary-foreground font-bold text-xl shadow-button transition-transform active:scale-95 hover:scale-[1.02]"
        >
          <span className="absolute inset-2 rounded-full border-2 border-primary-foreground/20" />
          <span className="relative flex flex-col items-center gap-1">
            <span className="text-3xl">＋1</span>
            <span className="text-sm font-medium opacity-90">断られた！</span>
          </span>
        </button>

        <div className="flex items-center gap-2 w-full max-w-xs">
          <button
            onClick={confirmReset}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/30 transition-transform active:scale-95 hover:bg-emerald-500/25"
          >
            <span>🎉</span>
            <span>成約した！</span>
          </button>
          <button
            onClick={() => setShowFullResetDialog(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-xs border border-destructive/25 transition-transform active:scale-95 hover:bg-destructive/20"
          >
            <span>🗑️</span>
            <span>リセット</span>
          </button>
        </div>

        {inZone && !cheer && (
          <p className="text-xs font-semibold text-primary text-center px-4">
            🔥 分母が貯まった！ドカンと1件、来るゾーン突入！
          </p>
        )}
      </main>

      {/* 名言オーバーレイ */}
      {cheer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 animate-cheer-long">
          <div className="absolute inset-0 bg-black/20" onClick={() => setCheer(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-md p-8 shadow-2xl border border-border text-center">
            <p className="text-4xl mb-4">💪</p>
            <p className="text-lg font-bold text-card-foreground leading-relaxed">
              {cheer}
            </p>
          </div>
        </div>
      )}

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border flex flex-col gap-5">
            <div className="text-center">
              <p className="text-3xl mb-2">🎉</p>
              <h2 className="text-lg font-bold text-card-foreground">成約おめでとう！</h2>
              <p className="text-sm text-muted-foreground mt-2">
                カウンターと確率ゲージをリセットしますか？
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelReset}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-transform active:scale-95"
              >
                キャンセル
              </button>
              <button
                onClick={doReset}
                className="flex-1 py-3 rounded-xl bg-gradient-button text-primary-foreground font-semibold text-sm shadow-button transition-transform active:scale-95"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border flex flex-col gap-5">
            <div className="text-center">
              <p className="text-3xl mb-2">⚠️</p>
              <h2 className="text-lg font-bold text-card-foreground">完全リセット</h2>
              <p className="text-sm text-muted-foreground mt-2">
                全データ（カウント・確率）を削除します。<br />本当によろしいですか？
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFullResetDialog(false)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-transform active:scale-95"
              >
                キャンセル
              </button>
              <button
                onClick={doFullReset}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm transition-transform active:scale-95"
              >
                完全リセット
              </button>
            </div>
          </div>
        </div>
      )}
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
