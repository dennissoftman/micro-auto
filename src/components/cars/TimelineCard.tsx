"use client";

import { useI18n } from "@/lib/i18n";
import { Activity, Wrench, Check, Edit, Trash2 } from "lucide-react";
import type { MaintenanceEvent } from "@/lib/db";
import { QuickPayPanel } from "./QuickPayPanel";

interface TimelineCardProps {
  event: MaintenanceEvent;
  onEdit: (event: MaintenanceEvent) => void;
  onDelete: (id: number) => void;
  isQuickPayActive: boolean;
  onToggleQuickPay: (id: number | null) => void;
}

export function TimelineCard({
  event,
  onEdit,
  onDelete,
  isQuickPayActive,
  onToggleQuickPay,
}: TimelineCardProps) {
  const { t } = useI18n();

  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active animate-enter">
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 dark:border-zinc-900 bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-white">
        {event.type === "Repair" ? (
          <Activity className="w-4 h-4" />
        ) : (
          <Wrench className="w-4 h-4" />
        )}
      </div>
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-5 rounded-2xl shadow hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-lg text-primary">
            {event.type === "Repair"
              ? t("repair")
              : event.type === "Oil Change"
                ? t("oilChange")
                : event.type === "Brake Pad Replacement"
                  ? t("brakePad")
                  : event.type === "Filter Change"
                    ? t("filterChange")
                    : event.type === "Inspection"
                      ? t("inspection")
                      : t("other")}
          </div>
          <time className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800/80 px-2 py-1 rounded">
            {event.date.toLocaleDateString()}
          </time>
        </div>

        {event.symptoms && (
          <div className="mt-3">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-1">
              {t("symptoms")}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 whitespace-pre-wrap">
              {event.symptoms}
            </p>
          </div>
        )}

        {event.diagnosticNotes && (
          <div className="mt-3">
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block mb-1">
              {t("diagnostics")}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30 whitespace-pre-wrap">
              {event.diagnosticNotes}
            </p>
          </div>
        )}

        <div className="mt-3">
          <span className="text-xs font-semibold text-green-500 uppercase tracking-wider block mb-1">
            {t("fixesApplied")}
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
            {event.fixesApplied}
          </p>
        </div>

        {event.replacedItems && event.replacedItems.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
              {t("replacedItems")}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {event.replacedItems.map((item, idx) => {
                const isObject = typeof item === "object" && item !== null;
                const name = isObject ? item.name : String(item);
                const quantity = isObject ? item.quantity : undefined;
                const isPaid = isObject ? item.isPaid !== false : true;
                const price = isObject ? item.price : undefined;
                const currency = isObject ? item.currency : undefined;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${
                      isPaid
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    <span>{name}</span>
                    {quantity && (
                      <span className="opacity-75 font-mono text-[10px]">
                        ({quantity})
                      </span>
                    )}
                    {price !== undefined && price !== null && (
                      <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                        - {currency === "USD" ? "$" : t("currencySymbolLocal")}
                        {price.toFixed(2)}
                      </span>
                    )}
                    {!isPaid && (
                      <span className="text-[8px] font-bold uppercase px-1 py-0.2 bg-red-500 text-white rounded">
                        {t("unpaid")}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {event.recommendations && (
          <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl animate-enter">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
              {t("recommendation")}
            </span>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap">
              "{event.recommendations}"
            </p>
          </div>
        )}

        {((event.cost !== undefined && event.cost !== null) ||
          event.paymentStatus) && (
          <div className="mt-3 flex items-center justify-between gap-4 p-2.5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t("price")}
              </span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {event.cost !== undefined && event.cost !== null
                  ? `${event.currency === "USD" ? "$" : t("currencySymbolLocal")}${event.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>

            {event.paymentStatus && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {t("paymentStatus")}
                </span>
                <span
                  className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    event.paymentStatus === "paid"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      : event.paymentStatus === "unpaid"
                        ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  {event.paymentStatus === "paid"
                    ? t("paid")
                    : event.paymentStatus === "unpaid"
                      ? t("unpaid")
                      : (() => {
                          const sym =
                            event.currency === "USD"
                              ? "$"
                              : t("currencySymbolLocal");
                          if (
                            event.paidAmount !== undefined &&
                            event.paidAmount !== null &&
                            event.cost !== undefined &&
                            event.cost !== null
                          ) {
                            const leftToPay = Math.max(
                              0,
                              event.cost - event.paidAmount,
                            );
                            return `${sym}${leftToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t("remaining")}`;
                          }
                          return t("partiallyPaid");
                        })()}
                </span>
              </div>
            )}
          </div>
        )}

        {isQuickPayActive && (
          <QuickPayPanel
            event={event}
            onCancel={() => onToggleQuickPay(null)}
            onSuccess={() => onToggleQuickPay(null)}
          />
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
          {event.paymentStatus !== "paid" && (
            <button
              onClick={() =>
                onToggleQuickPay(isQuickPayActive ? null : event.id!)
              }
              className={`flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-lg transition-all cursor-pointer mr-auto shadow-sm hover:scale-[1.02] active:scale-95 ${
                isQuickPayActive
                  ? "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800"
                  : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:text-emerald-500 dark:hover:text-emerald-300"
              }`}
              title={t("markAsPaid")}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t("markAsPaid")}</span>
            </button>
          )}
          <button
            onClick={() => onEdit(event)}
            className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
            title="Edit Record"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event.id!)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
