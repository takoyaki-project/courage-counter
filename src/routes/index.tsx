import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "rejection-log-v1";
const HEARD_STORAGE_KEY = "heard-log-v1";

const CHEERS = [
  "諦めたらそこで試合終了だよ",
  "鳴かぬなら、次に行こうホトトギス（信長風）",
  "敵は本能寺にあらず、次のビルにあり",
  "為せば成る、為さねば成らぬ何事も",
  "我以外皆我師。今の断りも学び",
  "明日死ぬかのように生きよ、永遠に生きるかのように学べ",
  "海賊王に、俺はなる！…の前に1件取る！",
  "ナイスチャレンジ！今の断られ方、次に繋がるいいスイングだ！",
  "断られてからが本番！今の1件で成約に一歩近づいた！",
  "今の1件で経験値ゲット！レベルアップだ！",
  "声出していこう！次のドアを叩け！",
  "汗かいた数だけ契約は近づく！",
  "ファイト！お前の足は何のためにある！",
  "お疲れ様！あそこの社長は今日、機嫌が悪かっただけ！",
  "とりあえず、自販機で美味い缶コーヒーでも飲んでリセットしよ！",
  "受付のお姉さんの塩対応も、芸のうち",
  "断りはタダ。ノーリスク・ハイ経験値！",
  "今日のあなた、靴底すり減らし選手権 優勝！",
  "断られた数 = 行動した証。胸を張れ！",
  "分母が育ってる！確率はあなたの味方！",
  "ノーカウントの神様なんていない。全部前進！",
  "成約までの距離、また1歩縮まった！",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "次行こか - 飛び込み営業応援ツール" },
      { name: "description", content: "飛び込み営業の心を支えるカウンター。ビルを出たら、ポチッ。" },
    ],
  }),
  component: Index,
});

function safeGet(key: string) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return 0;
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

function safeSet(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

function Index() {
  const [rejected, setRejected] = useState(0);
  const [heard, setHeard] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showFullResetDialog, setShowFullResetDialog] = useState(false);

  useEffect(() => {
    setRejected(safeGet(STORAGE_KEY));
    setHeard(safeGet(HEARD_STORAGE_KEY));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRejected(safeGet(STORAGE_KEY));
      if (e.key === HEARD_STORAGE_KEY) setHeard(safeGet(HEARD_STORAGE_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    safeSet(STORAGE_KEY, rejected);
  }, [rejected]);

  useEffect(() => {
    safeSet(HEARD_STORAGE_KEY, heard);
  }, [heard]);

  const meetingRate = rejected + heard > 0 ? (heard / (rejected + heard)) * 100 : 0;

  const handleRejected = () => {
    setRejected((c) => c + 1);
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    setTimeout(() => setCheer(null), 6000);
  };

  const handleHeard = () => {
    setHeard((c) => c + 1);
    setCheer("ナイス！話を聞いてもらえた、大きな一歩！");
    setTimeout(() => setCheer(null), 3500);
  };

  const doReset = () => {
    setRejected(0);
    setHeard(0);
    setShowResetDialog(false);
    setCheer("成約おめでとう！リセット完了 🎉");
    setTimeout(() => setCheer(null), 2200);
  };

  const doFullReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HEARD_STORAGE_KEY);
    } catch {
      // ignore
    }
    setRejected(0);
    setHeard(0);
    setShowFullResetDialog(false);
    setCheer("完全リセット完了。さあ、ゼロから！");
    setTimeout(() => setCheer(null), 2200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 pt-5 pb-24 bg-gradient-hero relative gap-5">
      <header className="w-full max-w-md text-center">
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
          飛び込み営業応援ツール
        </p>
        <h1 className="text-5xl font-extrabold text-foreground mt-1.5 tracking-tight">
          次行こか
        </h1>
        <p className="text-sm text-muted-foreground mt-2">ビルを出たら、ポチッ。</p>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-5">
        {/* 実績カード */}
        <div className="w-full grid grid-cols-3 gap-2">
          <StatCard label="断られた" value={rejected} unit="件" />
          <StatCard label="話を聞けた" value={heard} unit="件" accent />
          <StatCard
            label="面談化率"
            value={meetingRate.toFixed(1)}
            unit="%"
          />
        </div>

        {/* メインボタン */}
        <button
          onClick={handleRejected}
          className="group relative w-48 h-48 rounded-full bg-gradient-button text-primary-foreground font-bold shadow-button transition-transform active:scale-95 hover:scale-[1.02] mt-2"
        >
          <span className="absolute inset-2 rounded-full border-2 border-primary-foreground/20" />
          <span className="relative flex flex-col items-center gap-1">
            <span className="text-4xl">＋1</span>
            <span className="text-sm font-medium opacity-90">断られた！</span>
          </span>
        </button>

        {/* サブアクション */}
        <div className="flex items-center gap-2 w-full max-w-xs">
          <button
            onClick={handleHeard}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm border border-primary/25 transition-transform active:scale-95 hover:bg-primary/15"
          >
            <span>👂</span>
            <span>話を聞けた</span>
          </button>
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/30 transition-transform active:scale-95 hover:bg-emerald-500/25"
          >
            <span>🎉</span>
            <span>成約！</span>
          </button>
        </div>

        <button
          onClick={() => setShowFullResetDialog(true)}
          className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-4 transition-colors"
        >
          完全リセット
        </button>
      </main>

      {/* 名言オーバーレイ */}
      {cheer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 animate-cheer-long pointer-events-none">
          <div
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => setCheer(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-md p-8 shadow-2xl border border-border text-center pointer-events-auto">
            <p className="text-4xl mb-4">💪</p>
            <p className="text-lg font-bold text-card-foreground leading-relaxed">{cheer}</p>
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
                カウンターをリセットしますか？
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetDialog(false)}
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
                全データ（断られた・話を聞けた）を削除します。
                <br />
                本当によろしいですか？
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

function StatCard({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card/80 backdrop-blur-sm px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm ${
        accent ? "border-primary/30" : "border-border"
      }`}
    >
      <p className="text-[10px] text-muted-foreground tracking-wider">{label}</p>
      <p className="mt-1 leading-none">
        <span
          className={`text-2xl font-bold tabular-nums ${
            accent ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
