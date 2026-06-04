"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { Users, Phone, Car as CarIcon, Edit, Check, X } from "lucide-react";
import { updateOwner } from "@/lib/hooks";

export default function ClientsPage() {
  const { t } = useI18n();

  const owners = useLiveQuery(() => db.owners.toArray(), []);
  const cars = useLiveQuery(() => db.cars.toArray(), []);
  const events = useLiveQuery(() => db.maintenanceEvents.toArray(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  if (!owners || !cars || !events) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async (id: string) => {
    try {
      await updateOwner(id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save client");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { addOwner } = await import("@/lib/hooks");
    try {
      if (!newName.trim()) return;
      await addOwner({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });
      setIsAdding(false);
      setNewName("");
      setNewPhone("");
    } catch (e) {
      console.error(e);
      alert("Failed to add client");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-zinc-700 shadow-sm">
          <Users className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("clients")}</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("manageClients")}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
          >
            + {t("addNewClient")}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdding && (
          <form
            onSubmit={handleAdd}
            className="glass p-6 rounded-2xl shadow-sm border border-primary/20 dark:border-primary/20 flex flex-col gap-4 animate-enter"
          >
            <div className="space-y-3">
              <input
                autoFocus
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder={t("clientName")}
              />
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder={t("phoneNumber")}
              />
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("save")}
                </button>
              </div>
            </div>
          </form>
        )}
        {owners.map((owner) => {
          const ownerCars = cars.filter((c) => c.ownerId === owner.id);
          const ownerCarIds = new Set(ownerCars.map((c) => c.id));
          const ownerEvents = events.filter((e) => ownerCarIds.has(e.carId));

          let owedNative = 0;
          let owedUsd = 0;

          ownerEvents.forEach((e) => {
            const cost = e.cost || 0;
            const pStatus = e.paymentStatus || "unpaid";
            let eventOwedNative = 0;
            let eventOwedUsd = 0;

            if (cost > 0) {
              let owed = 0;
              if (pStatus === "unpaid") owed = cost;
              else if (pStatus === "partially_paid")
                owed = Math.max(0, cost - (e.paidAmount || 0));

              if (e.currency === "USD") eventOwedUsd = owed;
              else eventOwedNative = owed;
            } else {
              // Cost is 0. Sum up items to get derived cost.
              if (e.replacedItems && e.replacedItems.length > 0) {
                e.replacedItems.forEach((item) => {
                  if (item.price && !item.isPaid) {
                    if (item.currency === "USD") eventOwedUsd += item.price;
                    else eventOwedNative += item.price;
                  }
                });

                // Apply event-level payment status to derived item cost
                if (pStatus === "partially_paid") {
                  if (e.currency === "USD") {
                    eventOwedUsd = Math.max(0, eventOwedUsd);
                  } else {
                    eventOwedNative = Math.max(0, eventOwedNative);
                  }
                } else if (pStatus === "paid") {
                  eventOwedUsd = 0;
                  eventOwedNative = 0;
                }
              }
            }

            owedNative += eventOwedNative;
            owedUsd += eventOwedUsd;
          });

          const hasOwed = owedNative > 0 || owedUsd > 0;
          const isEditing = editingId === owner.id;

          return (
            <div
              key={owner.id}
              className="glass p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-4 animate-enter"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={t("clientName")}
                  />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={t("phoneNumber")}
                  />
                  <div className="flex items-center gap-2 justify-end pt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSave(owner.id!)}
                      className="p-1.5 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-1 flex-1">
                      {owner.name}
                    </h3>
                    <button
                      onClick={() => {
                        setEditingId(owner.id!);
                        setEditName(owner.name);
                        setEditPhone(owner.phone || "");
                      }}
                      className="text-slate-400 hover:text-primary transition-colors p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 flex-1">
                    {owner.phone ? (
                      <a
                        href={`tel:${owner.phone}`}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors w-fit"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        {owner.phone}
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400/50">
                        <Phone className="w-4 h-4 shrink-0" />
                        {t("noPhone")}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CarIcon className="w-4 h-4 shrink-0" />
                      {ownerCars.length}{" "}
                      {ownerCars.length === 1 ? t("car") : t("cars")}
                    </div>
                    {hasOwed ? (
                      <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
                        <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {t("unpaid") || "Owed"}:{" "}
                        {owedNative > 0
                          ? `${t("currencySymbolLocal") || ""}${owedNative.toFixed(2)}`
                          : ""}
                        {owedNative > 0 && owedUsd > 0 ? " / " : ""}
                        {owedUsd > 0 ? `$${owedUsd.toFixed(2)}` : ""}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          );
        })}
        {owners.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
            {t("noClientsYet")}
          </div>
        )}
      </div>
    </div>
  );
}
