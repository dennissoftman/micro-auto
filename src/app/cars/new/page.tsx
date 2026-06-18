"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addCar, useOwners, addOwner } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import {
  isValidPlate,
  normalizePlate,
  validatePlateAgainstFormat,
  getPlateFormatSettings,
  getFormatsPreview,
  decodeVin,
  isValidVin,
  normalizeSmartCasing,
} from "@/lib/utils";
import { useAppPreferences } from "@/lib/appPreferences";

export default function NewCarPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { usesClients } = useAppPreferences();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDecodingVin, setIsDecodingVin] = useState(false);

  const [formData, setFormData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    ownerId: "",
    vin: "",
    modification: "",
    edition: "",
    notes: "",
    fuelType: "",
    engineVolume: "",
    enginePower: "",
    engineType: "",
    transmission: "",
    drivetrain: "",
  });

  const [powerUnit, setPowerUnit] = useState<"hp" | "kW">("hp");
  const ownersRaw = useOwners();

  const sortedOwners = useMemo(() => {
    return [...(ownersRaw || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [ownersRaw]);

  useEffect(() => {
    const cleanVin = formData.vin.trim();
    if (!isValidVin(cleanVin)) {
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsDecodingVin(true);
      try {
        const decoded = await decodeVin(cleanVin);
        setFormData((prev) => {
          const isElectric = decoded.fuelType === "electric";
          if (isElectric) {
            setPowerUnit("kW");
          }
          let powerStr = "";
          if (decoded.enginePower) {
            if (isElectric) {
              powerStr = String(Math.round(decoded.enginePower * 0.7457));
            } else {
              powerStr = String(decoded.enginePower);
            }
          }
          return {
            ...prev,
            make: decoded.make || prev.make,
            model: decoded.model || prev.model,
            year: decoded.year || prev.year,
            fuelType: decoded.fuelType || prev.fuelType,
            engineVolume: isElectric
              ? ""
              : decoded.engineVolume !== undefined
                ? String(decoded.engineVolume)
                : prev.engineVolume,
            enginePower: powerStr || prev.enginePower,
            engineType: decoded.engineType || prev.engineType,
            transmission: decoded.transmission || prev.transmission,
            drivetrain: decoded.drivetrain || prev.drivetrain,
          };
        });
      } catch {
        // Silently ignore decode failures
      } finally {
        setIsDecodingVin(false);
      }
    }, 1200);

    return () => {
      clearTimeout(delayDebounceFn);
      setIsDecodingVin(false);
    };
  }, [formData.vin]);

  const handlePowerUnitChange = (newUnit: "hp" | "kW") => {
    if (newUnit === powerUnit) return;

    const currentVal = parseFloat(formData.enginePower);
    if (!isNaN(currentVal) && currentVal > 0) {
      const converted =
        newUnit === "kW"
          ? Math.round(currentVal * 0.7457)
          : Math.round(currentVal * 1.34102);
      setFormData((prev) => ({
        ...prev,
        enginePower: String(converted),
      }));
    }
    setPowerUnit(newUnit);
  };

  const handleFuelTypeChange = (newFuel: string) => {
    setFormData((prev) => {
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "fuelType") {
      handleFuelTypeChange(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "year" ? (value === "" ? "" : parseInt(value) || 0) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const plate = formData.licensePlate.trim();
    if (!isValidPlate(plate)) {
      setError(t("invalidPlate"));
      return;
    }

    const { enabled, formats } = getPlateFormatSettings();
    if (
      enabled &&
      !formats.some((fmt) => validatePlateAgainstFormat(plate, fmt))
    ) {
      const formatsPreview = getFormatsPreview(formats);
      setError(`${t("doesNotMatchFormat")} (e.g. ${formatsPreview})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedPlate = normalizePlate(plate);
      const normalizedMake = normalizeSmartCasing(formData.make);
      const normalizedModel = normalizeSmartCasing(formData.model);

      if (usesClients && !formData.ownerId) {
        setError(t("selectClientFirst") || "Please select a client.");
        setIsSubmitting(false);
        return;
      }
      const ownerId = usesClients
        ? formData.ownerId
        : await addOwner({ name: `Car: ${normalizedPlate}` });

      let powerHp: number | undefined;
      const parsedPower = parseFloat(formData.enginePower);
      if (!isNaN(parsedPower) && parsedPower > 0) {
        powerHp =
          powerUnit === "kW"
            ? Math.round(parsedPower * 1.34102)
            : Math.round(parsedPower);
      }

      const parsedVolume = parseFloat(formData.engineVolume);

      await addCar({
        ownerId,
        licensePlate: normalizedPlate,
        make: normalizedMake,
        model: normalizedModel,
        year: formData.year ? Number(formData.year) : undefined,
        vin: formData.vin.trim().toUpperCase() || undefined,
        modification: formData.modification.trim() || undefined,
        edition: formData.edition.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        fuelType: formData.fuelType || undefined,
        engineVolume: isNaN(parsedVolume) ? undefined : parsedVolume,
        enginePower: powerHp,
        engineType: formData.engineType.trim() || undefined,
        transmission: formData.transmission || undefined,
        drivetrain: formData.drivetrain || undefined,
      });
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add car. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionalText = t("optional");

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
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToDashboard")}
      </Link>

      <div className="glass rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          {usesClients ? t("addNewClientCar") : t("addNewCar")}
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {usesClients && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  {t("clientDetails")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="ownerId" className="text-sm font-medium">
                    {t("client")}
                  </label>
                  <select
                    required
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  >
                    <option value="" disabled>
                      — {t("selectClient")} —
                    </option>
                    {sortedOwners.map((owner) => (
                      <option
                        key={owner.id}
                        value={owner.id}
                        className="bg-white dark:bg-zinc-950"
                      >
                        {owner.name} {owner.phone ? `(${owner.phone})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-right">
                    <Link
                      href="/clients"
                      className="text-xs text-primary hover:underline"
                    >
                      + {t("addNewClient")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-2">
              {t("vehicleDetails")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <label htmlFor="vin">
                    {t("vin")}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      ({optionalText})
                    </span>
                  </label>
                  {isDecodingVin && (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-pulse">
                      <span className="w-2.5 h-2.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Decoding VIN...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  maxLength={17}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono transition-all uppercase placeholder:normal-case"
                  placeholder={t("vinPlaceholder")}
                  autoComplete="car-vin"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="licensePlate" className="text-sm font-medium">
                  {t("licensePlate")}
                </label>
                <input
                  required
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono transition-all"
                  placeholder="ABC-1234"
                  autoComplete="car-plate"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="year" className="text-sm font-medium">
                  {t("year")}
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  autoComplete="car-year"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="make" className="text-sm font-medium">
                  {t("make")}
                </label>
                <input
                  required
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Toyota"
                  autoComplete="car-make"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="model" className="text-sm font-medium">
                  {t("model")}
                </label>
                <input
                  required
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Camry"
                  autoComplete="car-model"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span
                className="text-[10px] transition-transform duration-200 inline-block"
                style={{
                  transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ▶
              </span>{" "}
              {t("advanced")}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 animate-enter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modification" className="text-sm font-medium">
                    {t("modification")}
                  </label>
                  <input
                    type="text"
                    id="modification"
                    name="modification"
                    value={formData.modification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="2.0 MT, 4WD, etc."
                    autoComplete="car-modification"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edition" className="text-sm font-medium">
                    {t("edition")}
                  </label>
                  <input
                    type="text"
                    id="edition"
                    name="edition"
                    value={formData.edition}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="SE, Executive, Titanium, etc."
                    autoComplete="car-edition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="fuelType" className="text-sm font-medium">
                    {t("fuelType")}
                  </label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
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

                <div className="space-y-1.5">
                  <label htmlFor="engineVolume" className="text-sm font-medium">
                    {t("engineVolume")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    id="engineVolume"
                    name="engineVolume"
                    value={formData.engineVolume}
                    disabled={formData.fuelType === "electric"}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      formData.fuelType === "electric"
                        ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-950"
                        : ""
                    }`}
                    placeholder="2.0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="enginePower" className="text-sm font-medium">
                    {t("enginePower")}
                  </label>
                  <div className="flex rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <input
                      type="number"
                      id="enginePower"
                      name="enginePower"
                      value={formData.enginePower}
                      onChange={handleChange}
                      className="flex-1 min-w-0 px-4 py-2 bg-transparent text-slate-900 dark:text-zinc-100 border-0 focus:outline-none focus:ring-0"
                      placeholder="150"
                      autoComplete="car-engine-power"
                    />
                    <select
                      value={powerUnit}
                      disabled={formData.fuelType === "electric"}
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

                <div className="space-y-1.5">
                  <label htmlFor="engineType" className="text-sm font-medium">
                    {t("engineType")}
                  </label>
                  <input
                    type="text"
                    id="engineType"
                    name="engineType"
                    value={formData.engineType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="E.g. 5.0L V8"
                    autoComplete="car-engine-type"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="transmission" className="text-sm font-medium">
                    {t("transmission")}
                  </label>
                  <select
                    id="transmission"
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
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
                  <label htmlFor="drivetrain" className="text-sm font-medium">
                    {t("drivetrain")}
                  </label>
                  <select
                    id="drivetrain"
                    name="drivetrain"
                    value={formData.drivetrain}
                    onChange={handleChange}
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

              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-sm font-medium">
                  {t("additionalNotes")}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24"
                  placeholder="E.g., client prefers specific oil brand, oil consumption is high..."
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? t("saving")
                : usesClients
                  ? t("saveClientCar")
                  : t("saveCar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
