"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n";
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Globe,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import {
  getPlateFormatSettings,
  savePlateFormatSettings,
  getFormatPreview,
  getFormatsPreview,
  DEFAULT_PLATE_FORMAT,
  type PlateFormatBlock,
} from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  const [plateValidationEnabled, setPlateValidationEnabled] = useState(false);
  const [plateFormats, setPlateFormats] = useState<PlateFormatBlock[][]>([
    DEFAULT_PLATE_FORMAT,
  ]);

  useEffect(() => {
    const { enabled, formats } = getPlateFormatSettings();
    setPlateValidationEnabled(enabled);
    setPlateFormats(formats);
  }, []);

  const handleToggleValidation = (checked: boolean) => {
    setPlateValidationEnabled(checked);
    savePlateFormatSettings(checked, plateFormats);
  };

  const handleAddFormat = () => {
    const updated = [...plateFormats, [...DEFAULT_PLATE_FORMAT]];
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  const handleDeleteFormat = (formatIndex: number) => {
    if (plateFormats.length <= 1) return;
    const updated = plateFormats.filter((_, idx) => idx !== formatIndex);
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  const handleAddBlock = (
    formatIndex: number,
    type: "letters" | "numbers" | "mixed",
  ) => {
    const format = plateFormats[formatIndex];
    if (format.length >= 8) return;
    const updatedFormat = [
      ...format,
      {
        type,
        minLength: type === "letters" ? 2 : type === "numbers" ? 4 : 6,
        maxLength: type === "letters" ? 2 : type === "numbers" ? 4 : 6,
      },
    ];
    const updated = [...plateFormats];
    updated[formatIndex] = updatedFormat;
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  const handleDeleteBlock = (formatIndex: number, blockIndex: number) => {
    const format = plateFormats[formatIndex];
    const updatedFormat = format.filter((_, idx) => idx !== blockIndex);
    const updated = [...plateFormats];
    updated[formatIndex] = updatedFormat;
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  const handleUpdateBlockType = (
    formatIndex: number,
    blockIndex: number,
    type: "letters" | "numbers" | "mixed",
  ) => {
    const format = plateFormats[formatIndex];
    const updatedFormat = [...format];
    const defLen = type === "letters" ? 2 : type === "numbers" ? 4 : 6;
    updatedFormat[blockIndex] = {
      type,
      minLength: defLen,
      maxLength: defLen,
    };
    const updated = [...plateFormats];
    updated[formatIndex] = updatedFormat;
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  const handleUpdateBlockMinLength = (
    formatIndex: number,
    blockIndex: number,
    length: number,
  ) => {
    const format = plateFormats[formatIndex];
    const block = format[blockIndex];
    if (length < 1 || length > block.maxLength) return;
    const updatedFormat = [...format];
    updatedFormat[blockIndex] = { ...block, minLength: length };
    const updated = [...plateFormats];
    updated[formatIndex] = updatedFormat;
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  const handleUpdateBlockMaxLength = (
    formatIndex: number,
    blockIndex: number,
    length: number,
  ) => {
    const format = plateFormats[formatIndex];
    const block = format[blockIndex];
    if (length < block.minLength || length > 15) return;
    const updatedFormat = [...format];
    updatedFormat[blockIndex] = { ...block, maxLength: length };
    const updated = [...plateFormats];
    updated[formatIndex] = updatedFormat;
    setPlateFormats(updated);
    savePlateFormatSettings(plateValidationEnabled, updated);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
        </div>
      </header>

      <div className="glass rounded-2xl p-6 md:p-8 space-y-8">
        {/* Theme Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-slate-500" />
            {t("theme")}
          </h3>
          <div className="flex bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-zinc-700/50">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${theme === "light" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              <Sun className="w-4 h-4" /> {t("light")}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${theme === "dark" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              <Moon className="w-4 h-4" /> {t("dark")}
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${theme === "system" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              <Monitor className="w-4 h-4" /> {t("system")}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-500" />
            {t("language")}
          </h3>
          <div className="flex bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-zinc-700/50">
            <button
              onClick={() => setLocale("en")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${locale === "en" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              English
            </button>
            <button
              onClick={() => setLocale("ru")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${locale === "ru" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}
            >
              Русский
            </button>
          </div>
        </div>

        {/* Plate Validation Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-primary/10 rounded text-primary text-[10px] font-bold font-mono border border-primary/20">
                PL
              </span>
              {t("plateValidation")}
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={plateValidationEnabled}
                onChange={(e) => handleToggleValidation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("strictPlateValidationDesc")}
          </p>

          {plateValidationEnabled && (
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-6 animate-enter">
              <div className="space-y-6">
                {plateFormats.map((format, fmtIdx) => (
                  <div
                    key={fmtIdx}
                    className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Format #{fmtIdx + 1}
                      </span>
                      {plateFormats.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFormat(fmtIdx)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Delete Format"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-zinc-900/55 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 min-h-[3.5rem]">
                      {format.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          Empty template...
                        </span>
                      ) : (
                        format.map((block, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-md border text-xs font-medium ${
                              block.type === "letters"
                                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400"
                                : block.type === "numbers"
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                                  : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400"
                            }`}
                          >
                            <select
                              value={block.type}
                              onChange={(e) =>
                                handleUpdateBlockType(
                                  fmtIdx,
                                  idx,
                                  e.target.value as any,
                                )
                              }
                              className="bg-transparent border-none font-bold text-[10px] focus:outline-none cursor-pointer uppercase tracking-wider"
                            >
                              <option value="letters">{t("letters")}</option>
                              <option value="numbers">{t("numbers")}</option>
                              <option value="mixed">{t("mixed")}</option>
                            </select>

                            <div className="flex flex-col gap-1 text-[9px] text-slate-500 bg-white dark:bg-zinc-900 p-1.5 rounded border border-slate-200/60 dark:border-zinc-800">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span>Min:</span>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBlockMinLength(
                                        fmtIdx,
                                        idx,
                                        block.minLength - 1,
                                      )
                                    }
                                    className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-2 h-2" />
                                  </button>
                                  <span className="w-3 text-center font-mono font-bold text-[9px]">
                                    {block.minLength}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBlockMinLength(
                                        fmtIdx,
                                        idx,
                                        block.minLength + 1,
                                      )
                                    }
                                    className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-2 h-2" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 justify-between">
                                <span>Max:</span>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBlockMaxLength(
                                        fmtIdx,
                                        idx,
                                        block.maxLength - 1,
                                      )
                                    }
                                    className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-2 h-2" />
                                  </button>
                                  <span className="w-3 text-center font-mono font-bold text-[9px]">
                                    {block.maxLength}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBlockMaxLength(
                                        fmtIdx,
                                        idx,
                                        block.maxLength + 1,
                                      )
                                    }
                                    className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-2 h-2" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(fmtIdx, idx)}
                              className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddBlock(fmtIdx, "letters")}
                          disabled={format.length >= 8}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-semibold border border-blue-200/55 dark:border-blue-900/40 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {t("addLettersSegment")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock(fmtIdx, "numbers")}
                          disabled={format.length >= 8}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-semibold border border-emerald-200/55 dark:border-emerald-900/40 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {t("addNumbersSegment")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock(fmtIdx, "mixed")}
                          disabled={format.length >= 8}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-md text-[10px] font-semibold border border-purple-200/55 dark:border-purple-900/40 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {t("mixed")}
                        </button>
                      </div>

                      <div className="text-[10px] font-semibold text-slate-400">
                        {t("preview")}:{" "}
                        <span className="font-mono text-xs text-primary bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200/60 dark:border-zinc-800">
                          {getFormatPreview(format) || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleAddFormat}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />+ Add Format Template
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <span>Active Previews (Any):</span>
                <span className="font-mono bg-white dark:bg-zinc-950 px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 font-bold text-sm tracking-widest text-primary shadow-sm">
                  {getFormatsPreview(plateFormats) || "-"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
