import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

const MONTHLY_STORAGE_KEY = "next-iko-monthly-v1";
const LEGACY_REJECTED_KEY = "rejection-log-v1";
const LEGACY_HEARD_KEY = "heard-log-v1";

type MonthlyData = Record<string, { rejected: number; heard: number }>;

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
  if (Math.random() < 0.2) {
    return CHEERS_KANSAI[Math.floor(Math.random() * CHEERS_KANSAI.length)];
  }
  return CHEERS_STANDARD[Math.floor(Math.random() * CHEERS_STANDARD.length)];
}

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}年${parseInt(m, 10)}月`;
}

function loadMonthly(): MonthlyData {
  try {
    const raw = localStorage.getItem(MONTHLY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as MonthlyData;
    }
    // legacy 移行
    const legacyR = parseInt(localStorage.getItem(LEGACY_REJECTED_KEY) || "0", 10);
    const legacyH = parseInt(localStorage.getItem(LEGACY_HEARD_KEY) || "0", 10);
    if (legacyR || legacyH) {
      const key = currentMonthKey();
      return { [key]: { rejected: legacyR || 0, heard: legacyH || 0 } };
    }
  } catch {
    // ignore
  }
  return {};
}

function saveMonthly(data: MonthlyData) {
  try {
    localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
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

function Index() {
  const [monthly, setMonthly] = useState<MonthlyData>({});
  const [cheer, setCheer] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showFullResetDialog, setShowFullResetDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const monthKey = currentMonthKey();

  useEffect(() => {
    setMonthly(loadMonthly());
  }, []);

  useEffect(() => {
    if (Object.keys(monthly).length > 0) saveMonthly(monthly);
  }, [monthly]);

  const current = monthly[monthKey] ?? { rejected: 0, heard: 0 };
  const rejected = current.rejected;
  const heard = current.heard;
  const meetingRate = rejected + heard > 0 ? (heard / (rejected + heard)) * 100 : 0;

  const bump = (field: "rejected" | "heard") => {
    setMonthly((prev) => {
      const cur = prev[monthKey] ?? { rejected: 0, heard: 0 };
      return { ...prev, [monthKey]: { ...cur, [field]: cur[field] + 1 } };
    });
    setCheer(pickCheer());
    setTimeout(() => setCheer(null), 6000);
  };

  const handleRejected = () => bump("rejected");
  const handleHeard = () => bump("heard");

  const doReset = () => {
    // 今月分のみリセット（履歴は残す）
    setMonthly((prev) => ({ ...prev, [monthKey]: { rejected: 0, heard: 0 } }));
    setShowResetDialog(false);
    setCheer("成約おめでとう！今月分リセット 🎉");
    setTimeout(() => setCheer(null), 2200);
  };

  const doFullReset = () => {
    try {
      localStorage.removeItem(MONTHLY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_REJECTED_KEY);
      localStorage.removeItem(LEGACY_HEARD_KEY);
    } catch {
      // ignore
    }
    setMonthly({});
    setShowFullResetDialog(false);
    setCheer("完全リセット完了。さあ、ゼロから！");
    setTimeout(() => setCheer(null), 2200);
  };

  const sortedMonths = useMemo(
    () => Object.keys(monthly).sort((a, b) => (a < b ? 1 : -1)),
    [monthly],
  );
  const hasHistory = sortedMonths.length > 0;

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
        {/* 今月の実績カード */}
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

        {/* 履歴トグル + リセット */}
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-card/70 text-foreground/80 font-semibold text-xs border border-border transition-transform active:scale-95 hover:bg-card"
          >
            <span>📅</span>
            <span>{showHistory ? "履歴を閉じる" : "月別履歴"}</span>
          </button>
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/30 transition-transform active:scale-95 hover:bg-emerald-500/25"
          >
            <span>🎉</span>
            <span>成約した！</span>
          </button>
        </div>

        {/* 月別履歴 */}
        {showHistory && (
          <section className="w-full mt-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs tracking-[0.25em] text-muted-foreground">履歴</p>
              <div className="h-px flex-1 bg-border" />
            </div>

            {!hasHistory && (
              <p className="text-center text-xs text-muted-foreground py-6">
                まだ記録がありません。今日からポチッ。
              </p>
            )}

            <ul className="flex flex-col">
              {sortedMonths.map((key) => {
                const m = monthly[key];
                const total = m.rejected + m.heard;
                const rate = total > 0 ? ((m.heard / total) * 100).toFixed(1) : "0.0";
                const isCurrent = key === monthKey;
                return (
                  <li
                    key={key}
                    className="border-t border-border py-3 flex items-center justify-between gap-3 last:border-b"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {formatMonthLabel(key)}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                          今月
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3 text-right">
                      <p className="text-base font-bold tabular-nums text-foreground">
                        {m.rejected}
                        <span className="text-muted-foreground mx-1 font-normal">/</span>
                        {m.heard}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums w-14">
                        {rate}%
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowFullResetDialog(true)}
                className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-4 transition-colors"
              >
                完全リセット
              </button>
            </div>
          </section>
        )}
      </main>

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
                今月分のカウンターをリセットしますか？
                <br />
                過去の月別履歴は残ります。
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
                月別履歴も含め、全データを削除します。
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
