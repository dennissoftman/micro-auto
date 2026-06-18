"use client";

import React, { useState, useId } from "react";
import { useI18n } from "@/lib/i18n";
import { Activity, FileText, Wrench } from "lucide-react";
import {
  addMaintenanceEvent,
  updateMaintenanceEvent,
  addImage,
  useAutocompleteSuggestions,
} from "@/lib/hooks";
import type { MaintenanceEvent, ReplacedItem } from "@/lib/db";
import { ItemsSumBanner } from "./ItemsSumBanner";
import { ImageManager } from "./ImageManager";

interface MaintenanceFormProps {
  carId: string;
  editingEventId: number | null;
  initialData?: Partial<MaintenanceEvent>;
  onCancel: () => void;
  onSuccess: () => void;
}

const maintenanceEventTypes: MaintenanceEvent["type"][] = [
  "Repair",
  "Oil Change",
  "Brake Pad Replacement",
  "Filter Change",
  "Inspection",
  "Other",
];

const currencies: NonNullable<MaintenanceEvent["currency"]>[] = [
  "native",
  "USD",
];

const paymentStatuses: NonNullable<MaintenanceEvent["paymentStatus"]>[] = [
  "paid",
  "unpaid",
  "partially_paid",
];

const isMaintenanceEventType = (
  value: string,
): value is MaintenanceEvent["type"] =>
  maintenanceEventTypes.includes(value as MaintenanceEvent["type"]);

const isCurrency = (
  value: string,
): value is NonNullable<MaintenanceEvent["currency"]> =>
  currencies.includes(value as NonNullable<MaintenanceEvent["currency"]>);

const isPaymentStatus = (
  value: string,
): value is NonNullable<MaintenanceEvent["paymentStatus"]> =>
  paymentStatuses.includes(
    value as NonNullable<MaintenanceEvent["paymentStatus"]>,
  );

export function MaintenanceForm({
  carId,
  editingEventId,
  initialData,
  onCancel,
  onSuccess,
}: MaintenanceFormProps) {
  const { t } = useI18n();
  const formId = useId();
  const { itemNames, recommendations: recommendedStrings } =
    useAutocompleteSuggestions();

  const getLocalDateString = (d?: Date) => {
    const date = d || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [eventType, setEventType] = useState<MaintenanceEvent["type"]>(
    initialData?.type || "Repair",
  );
  const [symptoms, setSymptoms] = useState(initialData?.symptoms || "");
  const [diagnosticNotes, setDiagnosticNotes] = useState(
    initialData?.diagnosticNotes || "",
  );
  const [fixesApplied, setFixesApplied] = useState(
    initialData?.fixesApplied || "",
  );
  const [eventDate, setEventDate] = useState(() =>
    getLocalDateString(initialData?.date),
  );
  const [cost, setCost] = useState(
    initialData?.cost !== undefined ? String(initialData.cost) : "",
  );
  const [eventCurrency, setEventCurrency] = useState<
    MaintenanceEvent["currency"]
  >(initialData?.currency || "native");
  const [replacedItems, setReplacedItems] = useState<ReplacedItem[]>(
    initialData?.replacedItems || [],
  );
  const [itemInput, setItemInput] = useState("");
  const [itemQtyInput, setItemQtyInput] = useState("");
  const [itemPriceInput, setItemPriceInput] = useState("");
  const [itemCurrencyInput, setItemCurrencyInput] =
    useState<ReplacedItem["currency"]>("native");
  const [itemIsPaidInput, setItemIsPaidInput] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    MaintenanceEvent["paymentStatus"]
  >(initialData?.paymentStatus || "unpaid");
  const [leftToPay, setLeftToPay] = useState(() => {
    if (
      initialData?.cost !== undefined &&
      initialData?.paidAmount !== undefined
    ) {
      return String(Math.max(0, initialData.cost - initialData.paidAmount));
    }
    return "";
  });
  const [recommendations, setRecommendations] = useState(
    initialData?.recommendations || "",
  );
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = eventDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);

    let finalCost: number | undefined;
    if (cost.trim() !== "") {
      finalCost = parseFloat(cost);
    }

    const payload: Omit<MaintenanceEvent, "id" | "createdAt"> = {
      carId,
      type: eventType,
      date: dateObj,
      symptoms: symptoms.trim() || undefined,
      diagnosticNotes: diagnosticNotes.trim() || undefined,
      fixesApplied: fixesApplied.trim() || undefined,
      cost: finalCost,
      currency: eventCurrency,
      replacedItems: replacedItems.length > 0 ? replacedItems : undefined,
      paymentStatus,
      paidAmount:
        paymentStatus === "partially_paid"
          ? finalCost !== undefined && leftToPay
            ? Math.max(0, finalCost - parseFloat(leftToPay))
            : undefined
          : paymentStatus === "paid" && finalCost !== undefined
            ? finalCost
            : undefined,
      recommendations: recommendations.trim() || undefined,
    };

    if (editingEventId !== null) {
      await updateMaintenanceEvent(editingEventId, payload);
    } else {
      const newEventId = await addMaintenanceEvent(payload);
      // Save pending images for newly created event
      for (const file of pendingImages) {
        await addImage(file, newEventId, "maintenanceEvent");
      }
    }
    onSuccess();
  };

  const handleAddItem = () => {
    const trimmedName = itemInput.trim();
    if (trimmedName && !replacedItems.some((i) => i.name === trimmedName)) {
      setReplacedItems([
        ...replacedItems,
        {
          name: trimmedName,
          quantity: itemQtyInput.trim() || undefined,
          isPaid: itemIsPaidInput,
          price: itemPriceInput ? parseFloat(itemPriceInput) : undefined,
          currency: itemCurrencyInput,
        },
      ]);
      setItemInput("");
      setItemQtyInput("");
      setItemPriceInput("");
      setItemCurrencyInput("native");
      setItemIsPaidInput(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 mb-8 animate-enter border-primary/30 shadow-lg shadow-primary/5">
      <h3 className="text-lg font-semibold mb-4">
        {editingEventId !== null
          ? t("editMaintenanceRecord")
          : t("addMaintenanceRecord")}
      </h3>
      <form onSubmit={handleAddEvent} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("recordType")}
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                if (isMaintenanceEventType(e.target.value)) {
                  setEventType(e.target.value);
                }
              }}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              <option value="Repair">{t("repair")}</option>
              <option value="Oil Change">{t("oilChange")}</option>
              <option value="Brake Pad Replacement">{t("brakePad")}</option>
              <option value="Filter Change">{t("filterChange")}</option>
              <option value="Inspection">{t("inspection")}</option>
              <option value="Other">{t("other")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-eventDate`}
              className="text-sm font-medium mb-1.5 block"
            >
              {t("date")}
            </label>
            <input
              type="date"
              id={`${formId}-eventDate`}
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor={`${formId}-eventCost`}
              className="text-sm font-medium mb-1.5 block"
            >
              {t("price")} ({t("optional")})
            </label>
            <div className="flex rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <input
                type="number"
                id={`${formId}-eventCost`}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <select
                value={eventCurrency}
                onChange={(e) => {
                  if (isCurrency(e.target.value)) {
                    setEventCurrency(e.target.value);
                  }
                }}
                className="px-3 border-l border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-0 text-sm font-medium rounded-r-lg cursor-pointer"
              >
                <option value="native" className="bg-white dark:bg-zinc-950">
                  {t("currencyLocal")}
                </option>
                <option value="USD" className="bg-white dark:bg-zinc-950">
                  {t("currencyUsd")}
                </option>
              </select>
            </div>
          </div>
        </div>

        {eventType === "Repair" && (
          <>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />{" "}
                {t("symptomsReported")}
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />{" "}
                {t("chainOfThought")}
              </label>
              <textarea
                value={diagnosticNotes}
                onChange={(e) => setDiagnosticNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
            <Wrench className="w-4 h-4 text-green-500" /> {t("fixesApplied")}
            {eventType === "Oil Change" && (
              <span className="text-slate-400 font-normal ml-1">
                ({t("optional")})
              </span>
            )}
          </label>
          <textarea
            required={eventType !== "Oil Change"}
            value={fixesApplied}
            onChange={(e) => setFixesApplied(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-20"
          />
        </div>

        <div>
          <label
            htmlFor={`${formId}-itemInput`}
            className="text-sm font-medium mb-1.5 block"
          >
            {t("replacedItems")} ({t("optional")})
          </label>
          <div className="flex flex-col gap-2.5 p-3 bg-slate-50 dark:bg-zinc-900/30 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-5">
                <input
                  type="text"
                  id={`${formId}-itemInput`}
                  list="itemNamesList"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder={t("addItemPlaceholder")}
                />
                <datalist id="itemNamesList">
                  {itemNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={itemQtyInput}
                  onChange={(e) => setItemQtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder={t("quantity")}
                />
              </div>
              <div className="md:col-span-3">
                <div className="flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-within:ring-2 focus-within:ring-primary/50 transition-all text-slate-900 dark:text-zinc-100">
                  <input
                    type="number"
                    value={itemPriceInput}
                    onChange={(e) => setItemPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    className="flex-1 min-w-0 px-3 py-1.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm"
                    placeholder={t("pricePerItem")}
                    step="0.01"
                    min="0"
                  />
                  <select
                    value={itemCurrencyInput}
                    onChange={(e) => {
                      if (isCurrency(e.target.value)) {
                        setItemCurrencyInput(e.target.value);
                      }
                    }}
                    className="px-2 border-l border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-0 text-sm font-medium rounded-r-lg cursor-pointer"
                  >
                    <option
                      value="native"
                      className="bg-white dark:bg-zinc-950"
                    >
                      {t("currencyLocal")}
                    </option>
                    <option value="USD" className="bg-white dark:bg-zinc-950">
                      {t("currencyUsd")}
                    </option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center">
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm cursor-pointer select-none w-full justify-center">
                  <input
                    type="checkbox"
                    checked={itemIsPaidInput}
                    onChange={(e) => setItemIsPaidInput(e.target.checked)}
                    className="rounded text-primary focus:ring-primary border-slate-350 dark:border-zinc-700"
                  />
                  <span className="text-xs">{t("itemIsPaid")}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full md:w-auto px-5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("addItem")}
              </button>
            </div>
          </div>
          {replacedItems.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 mt-2 bg-slate-50/50 dark:bg-zinc-900/20 rounded-lg border border-slate-200 dark:border-zinc-850 animate-enter">
              {replacedItems.map((item, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                    item.isPaid
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  }`}
                >
                  <span>{item.name}</span>
                  {item.quantity && (
                    <span className="opacity-75 font-mono text-[11px]">
                      ({item.quantity})
                    </span>
                  )}
                  {item.price !== undefined && item.price !== null && (
                    <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      -{" "}
                      {item.currency === "USD" ? "$" : t("currencySymbolLocal")}
                      {item.price.toFixed(2)}
                    </span>
                  )}
                  {!item.isPaid && (
                    <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-red-500 text-white rounded">
                      {t("unpaid")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setReplacedItems(
                        replacedItems.filter((_, i) => i !== idx),
                      )
                    }
                    className="hover:text-red-500 font-bold focus:outline-none ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <ItemsSumBanner
          replacedItems={replacedItems}
          eventCurrency={eventCurrency}
          cost={cost}
          setCost={setCost}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("paymentStatus")}
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => {
                if (isPaymentStatus(e.target.value)) {
                  setPaymentStatus(e.target.value);
                }
              }}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              <option value="paid">{t("paid")}</option>
              <option value="unpaid">{t("unpaid")}</option>
              <option value="partially_paid">{t("partiallyPaid")}</option>
            </select>
          </div>

          {paymentStatus === "partially_paid" && (
            <div className="animate-enter">
              <label
                htmlFor={`${formId}-leftToPay`}
                className="text-sm font-medium mb-1.5 block"
              >
                {t("leftToPay")}
              </label>
              <input
                type="number"
                id={`${formId}-leftToPay`}
                required
                value={leftToPay}
                onChange={(e) => setLeftToPay(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor={`${formId}-recommendations`}
            className="text-sm font-medium mb-1.5 block"
          >
            {t("recommendations")} ({t("optional")})
          </label>
          <textarea
            id={`${formId}-recommendations`}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-20"
            placeholder={t("recommendationsPlaceholder")}
          />
          {recommendedStrings.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {recommendedStrings
                .filter(
                  (r) =>
                    !recommendations ||
                    (r.toLowerCase().includes(recommendations.toLowerCase()) &&
                      r !== recommendations),
                )
                .slice(0, 5)
                .map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRecommendations(r)}
                    className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-foreground rounded-full transition-colors truncate max-w-[250px] cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <ImageManager
            entityId={editingEventId !== null ? editingEventId : undefined}
            entityType="maintenanceEvent"
            pendingImages={pendingImages}
            onPendingImagesChange={setPendingImages}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            {t("saveRecord")}
          </button>
        </div>
      </form>
    </div>
  );
}
