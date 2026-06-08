import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "rejection-log-v1";
const HEARD_STORAGE_KEY = "heard-log-v1";

const CHEERS_STANDARD = [
  "今日も一歩前進です",
  "ナイスチャレンジ！",
  "行動した分だけ前に進んでいます",
  "次の一件に向かいましょう",
  "お疲れさまでした",
  "断られた数は、行動した証です",
  "その一歩が、次の成約につながります",
  "声をかけた分だけ、確率は上がっています",
  "今日のチャレンジ、しっかり積み上がっています",
  "焦らず、一件ずつ進みましょう",
];

const CHEERS_KANSAI = [
  "しゃーない、次行こか！",
  "ぼちぼちいこか",
  "今日もよう頑張ったな",
  "ええチャレンジやったで！",
  "まだまだこれからやで！",
];

function pickCheer() {
  // 関西弁は20%程度で出現
  if (Math.random() < 0.2) {
    return CHEERS_KANSAI[Math.floor(Math.random() * CHEERS_KANSAI.length)];
  }
  return CHEERS_STANDARD[Math.floor(Math.random() * CHEERS_STANDARD.length)];
}

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
    setCheer(pickCheer());
    setTimeout(() => setCheer(null), 6000);
  };

  const handleHeard = () => {
    setHeard((c) => c + 1);
    setCheer(pickCheer());
    setTimeout(() => setCheer(null), 6000);
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
    <div className="min-h-screen bg-background flex flex-col items-center px-4 pt-5 pb-20 bg-gradient-hero relative gap-5">
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
          <StatCard label="面談化率" value={meetingRate.toFixed(1)} unit="%" />
        </div>

        {/* メインボタン2つ */}
        <div className="w-full flex items-center justify-center gap-3 mt-1">
          <button
            onClick={handleRejected}
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold shadow-button transition-transform active:scale-95 hover:scale-[1.02]"
          >
            <span className="absolute inset-2 rounded-full border-2 border-white/25" />
            <span className="relative flex flex-col items-center gap-1 px-2">
              <span className="text-3xl leading-none">🔴</span>
              <span className="text-base font-bold leading-tight">断られた！</span>
              <span className="text-xs opacity-90">＋1</span>
            </span>
          </button>

          <button
            onClick={handleHeard}
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 font-bold shadow-button transition-transform active:scale-95 hover:scale-[1.02]"
          >
            <span className="absolute inset-2 rounded-full border-2 border-amber-950/20" />
            <span className="relative flex flex-col items-center gap-1 px-2">
              <span className="text-3xl leading-none">🟡</span>
              <span className="text-sm font-bold leading-tight text-center">
                話を聞いて
                <br />
                もらえた！
              </span>
              <span className="text-xs opacity-80">＋1</span>
            </span>
          </button>
        </div>

        {/* リセット系 */}
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/30 transition-transform active:scale-95 hover:bg-emerald-500/25"
          >
            <span>🎉</span>
            <span>成約した！</span>
          </button>
          <button
            onClick={() => setShowFullResetDialog(true)}
            className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-4 transition-colors"
          >
            完全リセット
          </button>
        </div>
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
