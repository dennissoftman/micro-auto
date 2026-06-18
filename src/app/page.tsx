"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useCars, useOwners } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { MultiFieldSearchIndex } from "@/lib/utils";
import Link from "next/link";
import {
  Search,
  Plus,
  Car as CarIcon,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import Dexie from "dexie";
import { db } from "@/lib/db";
import type { Car } from "@/lib/db";
import { useAppPreferences } from "@/lib/appPreferences";
import { useLocalStorage } from "@/lib/useLocalStorage";

type SortField = "plate" | "model" | "year" | "lastMaintenance";
type SortDir = "asc" | "desc";

function SortHeader({
  field,
  activeField,
  sortDir,
  onSort,
  className,
  children,
}: {
  field: SortField;
  activeField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const active = activeField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors ${active ? "text-primary" : ""} ${className ?? ""}`}
    >
      {children}
      <span className="shrink-0">
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </button>
  );
}

export default function Dashboard() {
  const cars = useCars();
  const owners = useOwners();
  const { t } = useI18n();
  const { usesClients } = useAppPreferences();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useLocalStorage<"grid" | "list">(
    "dashViewMode",
    "grid",
  );
  const [sortField, setSortField] = useState<SortField>("plate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleView = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  const cleanSearchTerm = searchTerm.trim();

  const unpaidCarIds = useLiveQuery(async () => {
    const unpaidEvents = await db.maintenanceEvents
      .where("paymentStatus")
      .anyOf("unpaid", "partially_paid")
      .toArray();
    return new Set(unpaidEvents.map((e) => e.carId));
  }, []);

  // Last maintenance date per carId (for sorting)
  const lastMaintenanceMap = useLiveQuery(async () => {
    const allCars = await db.cars.toArray();
    const map = new Map<string, Date>();

    // Fetch only the latest event for each car using the [carId+date] index
    await Promise.all(
      allCars.map(async (car) => {
        if (!car.id) return;
        const lastEvent = await db.maintenanceEvents
          .where("[carId+date]")
          .between([car.id, Dexie.minKey], [car.id, Dexie.maxKey])
          .reverse()
          .first();

        if (lastEvent) {
          map.set(car.id, lastEvent.date);
        }
      }),
    );
    return map;
  }, []);

  const getOwnerName = useCallback((ownerId: string) => {
    return owners?.find((o) => o.id === ownerId)?.name || "Unknown Client";
  }, [owners]);

  const searchIndex = React.useMemo(() => {
    if (!cars) return null;
    return new MultiFieldSearchIndex(cars, (car) => [
      car.licensePlate,
      car.vin || "",
      usesClients ? getOwnerName(car.ownerId) : "",
      car.make,
      car.model,
    ]);
  }, [cars, getOwnerName, usesClients]);

  const filteredCars = React.useMemo(() => {
    if (!cleanSearchTerm) return cars;
    return searchIndex?.search(cleanSearchTerm);
  }, [searchIndex, cleanSearchTerm, cars]);

  const sortedCars = useMemo(() => {
    if (!filteredCars || viewMode !== "list") return filteredCars;
    return [...filteredCars].sort((a: Car, b: Car) => {
      let cmp = 0;
      switch (sortField) {
        case "plate":
          cmp = a.licensePlate.localeCompare(b.licensePlate);
          break;
        case "model":
          cmp = `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
          break;
        case "year":
          cmp = (a.year ?? 0) - (b.year ?? 0);
          break;
        case "lastMaintenance": {
          const aDate = lastMaintenanceMap?.get(a.id ?? "") ?? new Date(0);
          const bDate = lastMaintenanceMap?.get(b.id ?? "") ?? new Date(0);
          cmp = aDate.getTime() - bDate.getTime();
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredCars, sortField, sortDir, viewMode, lastMaintenanceMap]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {usesClients ? t("clientsAndCars") : t("carsDashboardTitle")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {usesClients ? t("manageActiveJobs") : t("manageCarsOnly")}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                usesClients ? t("searchPlaceholder") : t("searchCarsPlaceholder")
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm shrink-0">
            <button
              onClick={() => toggleView("grid")}
              title={t("viewGrid")}
              className={`p-2 transition-colors cursor-pointer ${viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleView("list")}
              title={t("viewList")}
              className={`p-2 transition-colors cursor-pointer ${viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/cars/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addCar")}</span>
          </Link>
        </div>
      </header>

      {/* Free Tier Warning */}
      {cars && cars.length >= 8 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-400">
              {t("approachingLimit")}
            </h4>
            <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1">
              {t("limitWarning", { count: cars.length })}
            </p>
          </div>
        </div>
      )}

      {/* Cars Grid / List */}
      {cars === undefined ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredCars?.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-zinc-800">
            <CarIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium">{t("noCarsFound")}</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            {searchTerm
              ? t("tryAdjustingSearch")
              : usesClients
                ? t("getStartedAdding")
                : t("getStartedAddingCar")}
          </p>
          {!searchTerm && (
            <Link
              href="/cars/new"
              className="mt-6 text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> {t("addFirstCar")}
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCars?.map((car) => {
            const hasUnpaid = unpaidCarIds?.has(car.id || "");
            return (
              <Link
                key={car.id}
                href={`/cars?id=${car.id}`}
                className="group block"
              >
                <div className="glass rounded-2xl p-5 hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 dark:bg-zinc-800/80 rounded-md font-mono text-sm font-medium border border-slate-200 dark:border-zinc-700">
                      {car.licensePlate}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {car.year || ""} {car.make}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {car.model}
                    </h3>
                    {usesClients ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasUnpaid ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                        />
                        {getOwnerName(car.ownerId)}
                        {hasUnpaid && (
                          <span
                            title={t("unpaid")}
                            className="flex items-center shrink-0 ml-1 animate-enter"
                          >
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasUnpaid ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                        />
                        {car.make} {car.model}
                        {hasUnpaid && (
                          <span
                            title={t("unpaid")}
                            className="flex items-center shrink-0 ml-1 animate-enter"
                          >
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="glass rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <div className="col-span-3">
              <SortHeader
                field="plate"
                activeField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              >
                {t("licensePlate")}
              </SortHeader>
            </div>
            <div className="col-span-4">
              <SortHeader
                field="model"
                activeField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              >
                {t("makeModel")}
              </SortHeader>
            </div>
            <div className="col-span-2">
              <SortHeader
                field="year"
                activeField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              >
                {t("year")}
              </SortHeader>
            </div>
            <div className="col-span-3">
              <SortHeader
                field="lastMaintenance"
                activeField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              >
                {t("lastService")}
              </SortHeader>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {sortedCars?.map((car) => {
              const hasUnpaid = unpaidCarIds?.has(car.id || "");
              const lastDate = lastMaintenanceMap?.get(car.id ?? "");
              return (
                <Link
                  key={car.id}
                  href={`/cars?id=${car.id}`}
                  className="group flex md:grid md:grid-cols-12 gap-3 md:gap-4 items-center px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="col-span-3 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-800/80 rounded font-mono text-sm font-medium border border-slate-200 dark:border-zinc-700 group-hover:border-primary/30 transition-colors">
                      {car.licensePlate}
                    </span>
                  </div>
                  <div className="col-span-4 font-semibold text-sm group-hover:text-primary transition-colors truncate">
                    {car.make} {car.model}
                  </div>
                  <div className="col-span-2 text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                    {car.year || "—"}
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasUnpaid ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                    />
                    <span className="truncate">
                      {lastDate ? (
                        lastDate.toLocaleDateString()
                      ) : (
                        <span className="italic opacity-50">{t("never")}</span>
                      )}
                    </span>
                    {hasUnpaid && (
                      <span
                        title={t("unpaid")}
                        className="flex items-center shrink-0 animate-enter"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
