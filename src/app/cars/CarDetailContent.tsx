"use client";

import { useState } from "react";
import {
  useCar,
  useMaintenanceEvents,
  useOwner,
  deleteMaintenanceEvent,
} from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import {
  ArrowLeft,
  Car as CarIcon,
  Calendar,
  Wrench,
  Plus,
  Edit,
  Copy,
  Check,
} from "lucide-react";
import type { MaintenanceEvent } from "@/lib/db";
import { CarEditForm } from "@/components/cars/CarEditForm";
import { MaintenanceForm } from "@/components/cars/MaintenanceForm";
import { TimelineCard } from "@/components/cars/TimelineCard";
import { ImageManager } from "@/components/cars/ImageManager";
import { useAppPreferences } from "@/lib/appPreferences";

interface CarDetailProps {
  carId: string;
}

export default function CarDetail({ carId }: CarDetailProps) {
  const { t } = useI18n();
  const { usesClients } = useAppPreferences();

  const car = useCar(carId);
  const history = (useMaintenanceEvents(carId) as MaintenanceEvent[]) || [];
  const owner = useOwner(car?.ownerId || "");

  const [isEditingCar, setIsEditingCar] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MaintenanceEvent | null>(
    null,
  );
  const [isCopied, setIsCopied] = useState(false);
  const [quickPayEventId, setQuickPayEventId] = useState<number | null>(null);

  const handleCopyVin = (vin: string) => {
    navigator.clipboard.writeText(vin);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getFuelLabel = (key?: string) => {
    if (!key) return "";
    const lowerKey = key.toLowerCase();
    if (lowerKey === "petrol") return t("petrol");
    if (lowerKey === "diesel") return t("diesel");
    if (lowerKey === "hybrid") return t("hybrid");
    if (lowerKey === "electric") return t("electric");
    if (lowerKey === "gas") return t("gas");
    if (lowerKey === "other") return t("other");
    return key;
  };

  const getTransmissionLabel = (key?: string) => {
    if (!key) return "";
    const lowerKey = key.toLowerCase();
    if (lowerKey === "automatic") return t("automatic");
    if (lowerKey === "manual") return t("manual");
    if (lowerKey === "cvt") return t("cvt");
    if (lowerKey === "dct") return t("dct");
    if (lowerKey === "direct_drive") return t("directDrive");
    if (lowerKey === "other") return t("other");
    return key;
  };

  const getDrivetrainLabel = (key?: string) => {
    if (!key) return "";
    const lowerKey = key.toLowerCase();
    if (lowerKey === "fwd") return t("fwd");
    if (lowerKey === "rwd") return t("rwd");
    if (lowerKey === "awd") return t("awd");
    if (lowerKey === "4wd") return t("4wd");
    return key;
  };

  if (car === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (car === null) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">{t("carNotFound")}</h2>
        <Link
          href="/"
          className="text-primary hover:underline mt-4 inline-block"
        >
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  let powerDisplay = "";
  if (car.enginePower) {
    const kw = Math.round(car.enginePower * 0.7457);
    powerDisplay = `${car.enginePower} hp / ${kw} kW`;
  }

  return (
    <div className="space-y-6">
      {isEditingCar ? (
        <CarEditForm
          car={car}
          owner={owner}
          usesClients={usesClients}
          onCancel={() => setIsEditingCar(false)}
          onSuccess={() => setIsEditingCar(false)}
        />
      ) : (
        <>
          <header className="flex justify-between items-start mb-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> {t("back")}
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-zinc-700 shadow-sm">
                  <CarIcon className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {car.year} {car.make} {car.model}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                      {car.licensePlate}
                    </span>
                    {usesClients && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("owner")}: {owner?.name || "Unknown"}{" "}
                        {owner?.phone ? `(${owner?.phone})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingCar(true)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-zinc-700 cursor-pointer shadow-sm animate-enter"
              >
                <Edit className="w-4 h-4" />
                <span>{t("editCar")}</span>
              </button>

              <button
                onClick={() => {
                  if (isAddingEvent) {
                    setIsAddingEvent(false);
                    setEditingEvent(null);
                  } else {
                    setIsAddingEvent(true);
                  }
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isAddingEvent ? t("cancel") : t("newRecord")}
                </span>
              </button>
            </div>
          </header>

          {/* Car Specifications and Notes Card */}
          {(car.modification ||
            car.edition ||
            car.notes ||
            car.vin ||
            car.fuelType ||
            car.engineVolume ||
            car.enginePower ||
            car.engineType ||
            car.transmission ||
            car.drivetrain) && (
            <div className="glass rounded-2xl p-6 border-slate-200 dark:border-zinc-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 animate-enter">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  {t("specifications")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {car.vin && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-400 block">
                        {t("vin")}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono font-bold tracking-wider bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                          {car.vin}
                        </span>
                        <button
                          onClick={() => handleCopyVin(car.vin!)}
                          className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                          title="Copy VIN"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {car.modification && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("modification")}
                      </span>
                      <span className="text-sm font-medium">
                        {car.modification}
                      </span>
                    </div>
                  )}
                  {car.edition && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("edition")}
                      </span>
                      <span className="text-sm font-medium">{car.edition}</span>
                    </div>
                  )}
                  {car.fuelType && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("fuelType")}
                      </span>
                      <span className="text-sm font-medium">
                        {getFuelLabel(car.fuelType)}
                      </span>
                    </div>
                  )}
                  {car.engineVolume !== undefined &&
                    car.fuelType !== "electric" && (
                      <div>
                        <span className="text-xs text-slate-400 block">
                          {t("engineVolume")}
                        </span>
                        <span className="text-sm font-medium">
                          {car.engineVolume} L
                        </span>
                      </div>
                    )}
                  {car.enginePower && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("enginePower")}
                      </span>
                      <span className="text-sm font-medium">
                        {powerDisplay}
                      </span>
                    </div>
                  )}
                  {car.engineType && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("engineType")}
                      </span>
                      <span className="text-sm font-medium">
                        {car.engineType}
                      </span>
                    </div>
                  )}
                  {car.transmission && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("transmission")}
                      </span>
                      <span className="text-sm font-medium">
                        {getTransmissionLabel(car.transmission)}
                      </span>
                    </div>
                  )}
                  {car.drivetrain && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {t("drivetrain")}
                      </span>
                      <span className="text-sm font-medium">
                        {getDrivetrainLabel(car.drivetrain)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {car.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    {t("notes")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 whitespace-pre-wrap">
                    {car.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="mt-6">
            <ImageManager entityId={car.id!} entityType="car" />
          </div>
        </>
      )}

      {isAddingEvent && (
        <MaintenanceForm
          carId={carId}
          editingEventId={editingEvent?.id || null}
          initialData={editingEvent || undefined}
          onCancel={() => {
            setIsAddingEvent(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setIsAddingEvent(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* History Timeline */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-slate-400" />{" "}
        {t("maintenanceHistory")}
      </h2>

      {history === undefined ? (
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-24 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full"></div>
          <div className="h-24 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border-dashed">
          <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">{t("noRecords")}</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-zinc-800 before:to-transparent">
          {history.map((event: MaintenanceEvent) => (
            <TimelineCard
              key={event.id}
              event={event}
              onEdit={(evt) => {
                setEditingEvent(evt);
                setIsAddingEvent(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={deleteMaintenanceEvent}
              isQuickPayActive={quickPayEventId === event.id}
              onToggleQuickPay={setQuickPayEventId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
