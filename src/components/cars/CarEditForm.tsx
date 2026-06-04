"use client";

import React, { useState, useId } from "react";
import { useI18n } from "@/lib/i18n";
import { Save } from "lucide-react";
import { updateCar, updateOwner } from "@/lib/hooks";
import {
  isValidPlate,
  normalizePlate,
  validatePlateAgainstFormat,
  getPlateFormatSettings,
  getFormatsPreview,
  normalizeSmartCasing,
} from "@/lib/utils";
import type { Car, Owner } from "@/lib/db";
import { FormInput } from "@/components/ui/FormInput";

interface CarEditFormProps {
  car: Car;
  owner: Owner | undefined;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CarEditForm({
  car,
  owner,
  onCancel,
  onSuccess,
}: CarEditFormProps) {
  const { t } = useI18n();
  const formId = useId();

  const [editError, setEditError] = useState("");
  const [powerUnit, setPowerUnit] = useState<"hp" | "kW">(() => {
    return car.fuelType === "electric" ? "kW" : "hp";
  });

  const [isCopied, setIsCopied] = useState(false);

  const initialPowerDisplayStr = () => {
    if (!car.enginePower) return "";
    if (car.fuelType === "electric") {
      return String(Math.round(car.enginePower * 0.7457));
    }
    return String(car.enginePower);
  };

  const [editFormData, setEditFormData] = useState({
    make: car.make,
    model: car.model,
    year: car.year || new Date().getFullYear(),
    licensePlate: car.licensePlate,
    vin: car.vin || "",
    modification: car.modification || "",
    edition: car.edition || "",
    clientName: owner?.name || "",
    clientPhone: owner?.phone || "",
    notes: car.notes || "",
    fuelType: car.fuelType || "",
    engineVolume:
      car.engineVolume !== undefined ? String(car.engineVolume) : "",
    enginePower: initialPowerDisplayStr(),
    engineType: car.engineType || "",
    transmission: car.transmission || "",
    drivetrain: car.drivetrain || "",
  });

  const handleCopyVin = (vin: string) => {
    navigator.clipboard.writeText(vin);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePowerUnitChange = (newUnit: "hp" | "kW") => {
    if (newUnit === powerUnit) return;
    const currentVal = parseFloat(editFormData.enginePower);
    if (!isNaN(currentVal) && currentVal > 0) {
      const converted =
        newUnit === "kW"
          ? Math.round(currentVal * 0.7457)
          : Math.round(currentVal * 1.34102);
      setEditFormData((prev) => ({ ...prev, enginePower: String(converted) }));
    }
    setPowerUnit(newUnit);
  };

  const handleFuelTypeChange = (newFuel: string) => {
    setEditFormData((prev) => {
      const isElectric = newFuel === "electric";
      let updatedPower = prev.enginePower;
      if (isElectric && powerUnit === "hp") {
        const currentPower = parseFloat(prev.enginePower);
        if (!isNaN(currentPower) && currentPower > 0) {
          updatedPower = String(Math.round(currentPower * 0.7457));
        }
        setPowerUnit("kW");
      }
      return {
        ...prev,
        fuelType: newFuel,
        engineVolume: isElectric ? "" : prev.engineVolume,
        enginePower: updatedPower,
      };
    });
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    const plate = editFormData.licensePlate.trim();
    if (!isValidPlate(plate)) {
      setEditError(t("invalidPlate"));
      return;
    }
    const { enabled, formats } = getPlateFormatSettings();
    if (
      enabled &&
      !formats.some((fmt) => validatePlateAgainstFormat(plate, fmt))
    ) {
      const formatsPreview = getFormatsPreview(formats);
      setEditError(`${t("doesNotMatchFormat")} (e.g. ${formatsPreview})`);
      return;
    }

    try {
      const normalizedPlate = normalizePlate(plate);
      const normalizedMake = normalizeSmartCasing(editFormData.make);
      const normalizedModel = normalizeSmartCasing(editFormData.model);
      const normalizedClientName = normalizeSmartCasing(
        editFormData.clientName,
      );

      let powerHp: number | undefined;
      const parsedPower = parseFloat(editFormData.enginePower);
      if (!isNaN(parsedPower) && parsedPower > 0) {
        powerHp =
          powerUnit === "kW"
            ? Math.round(parsedPower * 1.34102)
            : Math.round(parsedPower);
      }

      const parsedVolume = parseFloat(editFormData.engineVolume);

      const newOwnerData = {
        name: normalizedClientName,
        phone: editFormData.clientPhone.trim() || undefined,
      };

      const newCarData = {
        licensePlate: normalizedPlate,
        make: normalizedMake,
        model: normalizedModel,
        year: editFormData.year ? Number(editFormData.year) : undefined,
        vin: editFormData.vin.trim().toUpperCase() || undefined,
        modification: editFormData.modification.trim() || undefined,
        edition: editFormData.edition.trim() || undefined,
        notes: editFormData.notes.trim() || undefined,
        fuelType: editFormData.fuelType || undefined,
        engineVolume: isNaN(parsedVolume) ? undefined : parsedVolume,
        enginePower: powerHp,
        engineType: editFormData.engineType.trim() || undefined,
        transmission: editFormData.transmission || undefined,
        drivetrain: editFormData.drivetrain || undefined,
      };

      const hasOwnerChanged = newOwnerData.name !== owner?.name || newOwnerData.phone !== owner?.phone;
      const hasCarChanged = Object.entries(newCarData).some(([k, v]) => car[k as keyof Car] !== v);

      if (hasOwnerChanged) {
        await updateOwner(car.ownerId, newOwnerData);
      }
      if (hasCarChanged) {
        await updateCar(car.id!, newCarData);
      }
      onSuccess();
    } catch (err: any) {
      setEditError(err.message || "Failed to update car details.");
    }
  };

  const fuelOptions = [
    { value: "", label: `— ${t("fuelType")} —` },
    { value: "petrol", label: t("petrol") },
    { value: "diesel", label: t("diesel") },
    { value: "hybrid", label: t("hybrid") },
    { value: "electric", label: t("electric") },
    { value: "gas", label: t("gas") },
    { value: "other", label: t("other") },
  ];

  const transOptions = [
    { value: "", label: `— ${t("transmission")} —` },
    { value: "automatic", label: t("automatic") },
    { value: "manual", label: t("manual") },
    { value: "cvt", label: t("cvt") },
    { value: "dct", label: t("dct") },
    { value: "direct_drive", label: t("directDrive") },
    { value: "other", label: t("other") },
  ];

  const driveOptions = [
    { value: "", label: `— ${t("drivetrain")} —` },
    { value: "fwd", label: t("fwd") },
    { value: "rwd", label: t("rwd") },
    { value: "awd", label: t("awd") },
    { value: "4wd", label: t("4wd") },
  ];

  return (
    <form
      onSubmit={handleSaveCar}
      className="glass rounded-2xl p-6 md:p-8 space-y-6 animate-enter"
    >
      <h2 className="text-xl font-bold tracking-tight">
        {t("editCarDetails")}
      </h2>

      {editError && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm border border-red-200 dark:border-red-900/50">
          {editError}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {t("clientDetails")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            required
            label={t("clientName")}
            id={`${formId}-$1`}
            value={editFormData.clientName}
            onChange={(e) =>
              setEditFormData({ ...editFormData, clientName: e.target.value })
            }
            autoComplete="name"
          />
          <FormInput
            label={t("phoneNumber")}
            id={`${formId}-$1`}
            type="tel"
            value={editFormData.clientPhone}
            onChange={(e) =>
              setEditFormData({ ...editFormData, clientPhone: e.target.value })
            }
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-2">
          {t("vehicleDetails")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormInput
              label={t("vin")}
              id={`${formId}-$1`}
              maxLength={17}
              value={editFormData.vin}
              onChange={(e) =>
                setEditFormData({ ...editFormData, vin: e.target.value })
              }
              className="font-mono uppercase"
              autoComplete="car-vin"
            />
          </div>
          <FormInput
            required
            label={t("licensePlate")}
            id={`${formId}-$1`}
            value={editFormData.licensePlate}
            onChange={(e) =>
              setEditFormData({ ...editFormData, licensePlate: e.target.value })
            }
            className="font-mono"
            autoComplete="car-plate"
          />
          <FormInput
            type="number"
            label={t("year")}
            id={`${formId}-$1`}
            value={editFormData.year || ""}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                year: parseInt(e.target.value) || 0,
              })
            }
            autoComplete="car-year"
          />
          <FormInput
            required
            label={t("make")}
            id={`${formId}-$1`}
            value={editFormData.make}
            onChange={(e) =>
              setEditFormData({ ...editFormData, make: e.target.value })
            }
            autoComplete="car-make"
          />
          <FormInput
            required
            label={t("model")}
            id={`${formId}-$1`}
            value={editFormData.model}
            onChange={(e) =>
              setEditFormData({ ...editFormData, model: e.target.value })
            }
            autoComplete="car-model"
          />
          <FormInput
            label={t("modification")}
            id={`${formId}-$1`}
            value={editFormData.modification}
            onChange={(e) =>
              setEditFormData({ ...editFormData, modification: e.target.value })
            }
            autoComplete="car-modification"
          />
          <FormInput
            label={t("edition")}
            id={`${formId}-$1`}
            value={editFormData.edition}
            onChange={(e) =>
              setEditFormData({ ...editFormData, edition: e.target.value })
            }
            autoComplete="car-edition"
          />

          <div className="space-y-1.5">
            <label htmlFor={`${formId}-$1`} className="text-sm font-medium">
              {t("fuelType")}
            </label>
            <select
              id={`${formId}-$1`}
              value={editFormData.fuelType}
              onChange={(e) => handleFuelTypeChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {fuelOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-zinc-950"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            type="number"
            step="0.1"
            min="0"
            max="20"
            label={t("engineVolume")}
            id={`${formId}-$1`}
            value={editFormData.engineVolume}
            disabled={editFormData.fuelType === "electric"}
            onChange={(e) =>
              setEditFormData({ ...editFormData, engineVolume: e.target.value })
            }
            placeholder="2.0"
          />

          <div className="space-y-1.5">
            <label htmlFor={`${formId}-$1`} className="text-sm font-medium">
              {t("enginePower")}
            </label>
            <div className="flex rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <input
                type="number"
                id={`${formId}-$1`}
                value={editFormData.enginePower}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    enginePower: e.target.value,
                  })
                }
                className="flex-1 min-w-0 px-4 py-2 bg-transparent text-slate-900 dark:text-zinc-100 border-0 focus:outline-none focus:ring-0"
                placeholder="150"
                autoComplete="car-engine-power"
              />
              <select
                value={powerUnit}
                disabled={editFormData.fuelType === "electric"}
                onChange={(e) =>
                  handlePowerUnitChange(e.target.value as "hp" | "kW")
                }
                className="px-3 border-l border-slate-200 dark:border-zinc-800 bg-transparent text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-0 text-sm font-medium rounded-r-lg"
              >
                <option value="hp" className="bg-white dark:bg-zinc-950">
                  HP
                </option>
                <option value="kW" className="bg-white dark:bg-zinc-950">
                  kW
                </option>
              </select>
            </div>
          </div>

          <FormInput
            label={t("engineType")}
            id={`${formId}-$1`}
            value={editFormData.engineType}
            onChange={(e) =>
              setEditFormData({ ...editFormData, engineType: e.target.value })
            }
            placeholder="E.g. 5.0L V8"
            autoComplete="car-engine-type"
          />

          <div className="space-y-1.5">
            <label htmlFor={`${formId}-$1`} className="text-sm font-medium">
              {t("transmission")}
            </label>
            <select
              id={`${formId}-$1`}
              value={editFormData.transmission}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  transmission: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {transOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-zinc-950"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${formId}-$1`} className="text-sm font-medium">
              {t("drivetrain")}
            </label>
            <select
              id={`${formId}-$1`}
              value={editFormData.drivetrain}
              onChange={(e) =>
                setEditFormData({ ...editFormData, drivetrain: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {driveOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-zinc-950"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${formId}-$1`} className="text-sm font-medium">
          {t("additionalNotes")}
        </label>
        <textarea
          id={`${formId}-$1`}
          value={editFormData.notes}
          onChange={(e) =>
            setEditFormData({ ...editFormData, notes: e.target.value })
          }
          className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {t("save")}
        </button>
      </div>
    </form>
  );
}
