import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

const MONTHLY_STORAGE_KEY = "next-iko-monthly-v1";
const LEGACY_REJECTED_KEY = "rejection-log-v1";
const LEGACY_HEARD_KEY = "heard-log-v1";

type MonthlyData = Record<string, { rejected: number; heard: number; closed?: number }>;

const CHEERS_STANDARD = [
  "今日も一歩前進です",
  "ナイスチャレンジ！",
  "行動した分だけ前に進んでいます",
  "次の一件に向かいましょう",
  "お疲れさまでした",
  "断られた数は、行動した証です",
  "その一歩が、次の成約につながります",
  "声をかけた分だけ、確率は上がっています",
];

const CHEERS_KANSAI = [
  "しゃーない、次行こか！",
  "ぼちぼちいこか",
  "今日もよう頑張ったな",
  "ええチャレンジやったで！",
  "まだまだこれからやで！",
];

const CLOSE_CHEERS = [
  "成約おめでとう！🎉",
  "やったね！ナイス成約！",
  "最高の一日！おめでとう！",
  "努力が実りましたね🎊",
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
    const legacyR = parseInt(localStorage.getItem(LEGACY_REJECTED_KEY) || "0", 10);
    const legacyH = parseInt(localStorage.getItem(LEGACY_HEARD_KEY) || "0", 10);
    if (legacyR || legacyH) {
      const key = currentMonthKey();
      return { [key]: { rejected: legacyR || 0, heard: legacyH || 0, closed: 0 } };
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
      { title: "次行こか — 飛び込み営業応援ツール｜ワンタップで結果を記録" },
      { name: "description", content: "「次行こか」は飛び込み営業の結果をワンタップで記録する応援ツール。断られた件数・話を聞けた件数・面談化率を月別に可視化し、次の一歩を後押しします。" },
      { property: "og:title", content: "次行こか — 飛び込み営業応援ツール" },
      { property: "og:description", content: "飛び込み営業の結果をワンタップで記録。断られた件数・話を聞けた件数・面談化率を月別に可視化し、次の一歩を後押しする応援ツールです。" },
      { property: "og:url", content: "https://courage-counter.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://courage-counter.lovable.app/" },
    ],
  }),
  component: Index,
});

function Index() {
  const [monthly, setMonthly] = useState<MonthlyData>({});
  const [cheer, setCheer] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFullResetDialog, setShowFullResetDialog] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [lastAction, setLastAction] = useState<{ field: "rejected" | "heard" | "closed"; monthKey: string } | null>(null);

  const monthKey = currentMonthKey();

  useEffect(() => {
    setMonthly(loadMonthly());
  }, []);

  useEffect(() => {
    if (Object.keys(monthly).length > 0) saveMonthly(monthly);
  }, [monthly]);

  const current = monthly[monthKey] ?? { rejected: 0, heard: 0, closed: 0 };
  const rejected = current.rejected;
  const heard = current.heard;
  const meetingRate = rejected + heard > 0 ? (heard / (rejected + heard)) * 100 : 0;

  const bump = (field: "rejected" | "heard" | "closed", msg?: string) => {
    setMonthly((prev) => {
      const cur = prev[monthKey] ?? { rejected: 0, heard: 0, closed: 0 };
      return {
        ...prev,
        [monthKey]: {
          rejected: cur.rejected,
          heard: cur.heard,
          closed: cur.closed ?? 0,
          [field]: (cur[field] ?? 0) + 1,
        },
      };
    });
    setCheer(msg ?? pickCheer());
    setLastAction({ field, monthKey });
    setTimeout(() => setCheer(null), 6000);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    const { field, monthKey: mk } = lastAction;
    setMonthly((prev) => {
      const cur = prev[mk];
      if (!cur) return prev;
      const next = (cur[field] ?? 0) - 1;
      return {
        ...prev,
        [mk]: {
          rejected: cur.rejected,
          heard: cur.heard,
          closed: cur.closed ?? 0,
          [field]: next < 0 ? 0 : next,
        },
      };
    });
    setLastAction(null);
    setCheer("1つ戻しました");
    setTimeout(() => setCheer(null), 2000);
  };

  const handleRejected = () => bump("rejected");
  const handleHeard = () => bump("heard");
  const handleClosed = () => {
    bump("closed", CLOSE_CHEERS[Math.floor(Math.random() * CLOSE_CHEERS.length)]);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3500);
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
    setLastAction(null);
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
    <div className="min-h-screen flex flex-col items-center px-4 pt-6 pb-10 bg-gradient-hero relative gap-5">
      <header className="w-full max-w-md text-center">
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground">
          飛び込み営業応援ツール
        </p>
        <h1 className="text-5xl font-black text-foreground mt-1.5 tracking-tight">
          次行こか
          <span className="sr-only"> — 飛び込み営業応援ツール</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">ビルを出たら、ポチッ。</p>
      </header>

      <main className="w-full max-w-md flex flex-col gap-5">
        {/* 統計カード */}
        <div className="w-full grid grid-cols-3 gap-2">
          <StatCard label="断られた" value={rejected} unit="件" />
          <StatCard label="話を聞けた" value={heard} unit="件" accent />
          <StatCard label="面談化率" value={meetingRate.toFixed(1)} unit="%" />
        </div>

        {/* メインボタン: 信号機 */}
        <div className="w-full flex flex-col gap-2.5 px-1">
          <SignalButton
            label="断られた！"
            onClick={handleRejected}
            className="bg-gradient-to-b from-[#ee5a52] to-[#d6433b] focus-visible:ring-rose-400"
          />
          <SignalButton
            label="話を聞いてもらえた！"
            onClick={handleHeard}
            className="bg-gradient-to-b from-[#f7d152] to-[#e8b624] text-[#3a2a00] focus-visible:ring-amber-400"
            dark
          />
          <SignalButton
            label="成約した！"
            onClick={handleClosed}
            className="bg-gradient-to-b from-[#5cc28e] to-[#3fa46d] focus-visible:ring-emerald-400"
          />
        </div>

        {/* アンドゥ */}
        <div className="w-full flex justify-center -mt-2">
          <button
            onClick={handleUndo}
            disabled={!lastAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur border border-border text-xs font-semibold text-foreground/70 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>↩︎</span>
            <span>
              {lastAction
                ? `「${lastAction.field === "rejected" ? "断られた" : lastAction.field === "heard" ? "話を聞けた" : "成約した"}」を1つ戻す`
                : "1つ戻す"}
            </span>
          </button>
        </div>

        {/* 履歴アコーディオン */}
        <div className="w-full mt-1">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/70 backdrop-blur border border-border text-sm font-semibold text-foreground/80 transition-transform active:scale-[0.98]"
          >
            <span>📅</span>
            <span>{showHistory ? "履歴を閉じる" : "履歴を見る"}</span>
            <span className={`transition-transform ${showHistory ? "rotate-180" : ""}`}>▾</span>
          </button>

          {showHistory && (
            <div className="mt-3 rounded-2xl bg-white/70 backdrop-blur border border-border overflow-hidden">
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
                      className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {formatMonthLabel(key)}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                            今月
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-3 text-right">
                        <p className="text-sm font-bold tabular-nums text-foreground">
                          {m.rejected}
                          <span className="text-muted-foreground mx-1 font-normal">/</span>
                          {m.heard}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums w-12">
                          {rate}%
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="mt-auto pt-6 flex flex-col items-center gap-2">
        <button
          onClick={() => setShowFullResetDialog(true)}
          className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-4 transition-colors"
        >
          完全リセット
        </button>
        <div className="text-[10px] text-muted-foreground/60 tracking-wider">
          TAKOYAKI PROJECT
        </div>
      </footer>

      {/* 紙吹雪 */}
      {confetti && (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => {
            const colors = ["#ee5a52", "#f7d152", "#5cc28e", "#7aa9f7", "#e88ac6"];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.6;
            const dur = 2.5 + Math.random() * 1.5;
            const size = 6 + Math.random() * 6;
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  top: "-10vh",
                  left: `${left}%`,
                  width: size,
                  height: size * 1.4,
                  background: colors[i % colors.length],
                  borderRadius: 2,
                  animation: `confetti-fall ${dur}s ${delay}s linear forwards`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* 応援コメント */}
      {cheer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 animate-cheer-long pointer-events-none">
          <div
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => setCheer(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-md p-8 shadow-2xl border border-border text-center pointer-events-auto">
            <p className="text-4xl mb-4">💪</p>
            <p className="text-lg font-bold text-card-foreground leading-relaxed">{cheer}</p>
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

function SignalButton({
  label,
  onClick,
  className,
  dark = false,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-[84px] rounded-3xl font-bold text-[20px] tracking-wide shadow-button transition-transform active:scale-[0.97] focus:outline-none focus-visible:ring-4 ${dark ? "" : "text-white"} ${className ?? ""}`}
    >
      {label}
    </button>
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
      className={`rounded-2xl bg-white px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm border ${
        accent ? "border-primary/30" : "border-border/60"
      }`}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 leading-none">
        <span
          className={`text-2xl font-black tabular-nums ${
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
