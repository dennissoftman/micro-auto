"use client";

import { useI18n } from "@/lib/i18n";
import type { ReplacedItem, MaintenanceEvent } from "@/lib/db";

interface ItemsSumBannerProps {
  replacedItems: ReplacedItem[];
  eventCurrency: MaintenanceEvent["currency"];
  cost: string;
  setCost: (val: string) => void;
}

export function ItemsSumBanner({
  replacedItems,
  eventCurrency,
  cost,
  setCost,
}: ItemsSumBannerProps) {
  const { t } = useI18n();

  const pricedItems = replacedItems.filter(
    (it) => it.price !== undefined && it.price !== null,
  );
  if (pricedItems.length === 0) return null;

  const sameCurrencyItems = pricedItems.filter(
    (it) => (it.currency ?? "native") === (eventCurrency ?? "native"),
  );
  const mixedCurrency = sameCurrencyItems.length < pricedItems.length;
  const itemsSum = sameCurrencyItems.reduce(
    (acc, it) => acc + (it.price ?? 0),
    0,
  );
  const sym = eventCurrency === "USD" ? "$" : t("currencySymbolLocal");
  const costNum = cost ? parseFloat(cost) : null;
  const sumDisplay = `${sym}${itemsSum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (mixedCurrency && sameCurrencyItems.length === 0) return null;

  const mismatch = costNum !== null && Math.abs(costNum - itemsSum) > 0.001;
  const noTotal = costNum === null && itemsSum > 0;

  if (!mismatch && !noTotal) return null;

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs animate-enter ${
        mismatch
          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
          : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400"
      }`}
    >
      <span className="shrink-0 mt-0.5">{mismatch ? "⚠️" : "ℹ️"}</span>
      <div className="flex-1">
        {mismatch ? (
          <span>
            {t("itemsSumMismatch")} <strong>{sumDisplay}</strong>
            {mixedCurrency && ` (${t("sameCurrencyOnly")})`}
          </span>
        ) : (
          <span>
            {t("itemsSumSuggestion")} <strong>{sumDisplay}</strong>
            {mixedCurrency && ` (${t("sameCurrencyOnly")})`}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setCost(itemsSum.toFixed(2))}
        className="shrink-0 font-semibold underline hover:no-underline cursor-pointer"
      >
        {t("useSum")}
      </button>
    </div>
  );
}
