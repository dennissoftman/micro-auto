"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Check } from "lucide-react";
import { updateMaintenanceEvent } from "@/lib/hooks";
import type { MaintenanceEvent } from "@/lib/db";

interface QuickPayPanelProps {
  event: MaintenanceEvent;
  onCancel: () => void;
  onSuccess: () => void;
}

export function QuickPayPanel({
  event,
  onCancel,
  onSuccess,
}: QuickPayPanelProps) {
  const { t } = useI18n();
  const [quickPayAmount, setQuickPayAmount] = useState("");

  const handlePay = async () => {
    if (!event.id) return;
    const isPartial = quickPayAmount.trim() !== "";
    const updatedItems = event.replacedItems?.map((item) => ({
      ...item,
      isPaid: true,
    }));

    const payment = isPartial ? parseFloat(quickPayAmount) : 0;
    const currentPaid = event.paidAmount || 0;
    const totalCost = event.cost || 0;

    let newPaidAmount = currentPaid + payment;
    let newStatus = "partially_paid";

    if (!isPartial) {
      newPaidAmount = totalCost;
      newStatus = "paid";
    } else if (totalCost > 0 && newPaidAmount >= totalCost) {
      newStatus = "paid";
    }

    await updateMaintenanceEvent(event.id, {
      paymentStatus: newStatus as any,
      paidAmount: newPaidAmount,
      replacedItems: newStatus === "paid" ? updatedItems : event.replacedItems,
    });
    onSuccess();
  };

  return (
    <div className="mt-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl animate-enter">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <input
            autoFocus
            type="number"
            value={quickPayAmount}
            onChange={(e) => setQuickPayAmount(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                await handlePay();
              }
              if (e.key === "Escape") {
                onCancel();
              }
            }}
            className="flex-1 min-w-0 px-3 py-1.5 bg-transparent text-slate-900 dark:text-zinc-100 border-0 focus:outline-none focus:ring-0 text-sm"
            placeholder={t("partialAmount")}
            step="0.01"
            min="0"
          />
          <button
            onClick={handlePay}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {t("save")}
          </button>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0"
        >
          {t("cancel")}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
        {t("quickPayHint")}
      </p>
    </div>
  );
}
