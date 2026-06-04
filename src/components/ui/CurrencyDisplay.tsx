"use client";

import { useI18n } from "@/lib/i18n";

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  currency?: "USD" | "native";
  className?: string;
  hideSymbolIfZero?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = "native",
  className = "",
  hideSymbolIfZero = false,
}: CurrencyDisplayProps) {
  const { t } = useI18n();

  if (amount === undefined || amount === null) {
    return null;
  }

  if (hideSymbolIfZero && amount === 0) {
    return <span className={className}>0</span>;
  }

  const sym = currency === "USD" ? "$" : t("currencySymbolLocal");
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={className}>
      {sym}
      {formatted}
    </span>
  );
}
