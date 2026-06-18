import {
  LEGACY_PLATE_FORMAT_KEY,
  PLATE_FORMATS_KEY,
  PLATE_VALIDATION_ENABLED_KEY,
} from "./storageKeys";

export interface PlateFormatBlock {
  type: "letters" | "numbers" | "mixed";
  minLength: number;
  maxLength: number;
}

export const DEFAULT_PLATE_FORMAT: PlateFormatBlock[] = [
  { type: "letters", minLength: 2, maxLength: 2 },
  { type: "numbers", minLength: 4, maxLength: 4 },
  { type: "letters", minLength: 2, maxLength: 2 },
];

export const HP_TO_KW = 0.7457;
export const KW_TO_HP = 1.34102;

export function convertHpToKw(hp: number): number {
  return Math.round(hp * HP_TO_KW);
}

export function convertKwToHp(kw: number): number {
  return Math.round(kw * KW_TO_HP);
}

export function normalizeSmartCasing(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\s+/)
    .map((word) => {
      const lettersOnly = word.replace(/[^a-zA-Z]/g, "");

      // If word contains letters and has no vowels (excluding 'y' to catch 'byd'),
      // we assume it is a capital-only acronym/abbreviation (e.g. BMW, GT, V8, 4WD)
      const hasVowels = /[aeiou]/i.test(lettersOnly);
      if (lettersOnly.length > 0 && !hasVowels && word.length > 1) {
        return word.toUpperCase();
      }

      // Default: Title Case (capitalize first letter, lowercase the rest)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Safe simple fallback for older browsers or non-HTTPS localhost contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getPlateFormatSettings() {
  if (typeof window === "undefined") {
    return { enabled: false, formats: [DEFAULT_PLATE_FORMAT] };
  }
  const enabled = localStorage.getItem(PLATE_VALIDATION_ENABLED_KEY) === "true";
  const formatsStr = localStorage.getItem(PLATE_FORMATS_KEY);
  let formats: PlateFormatBlock[][] = [DEFAULT_PLATE_FORMAT];
  if (formatsStr) {
    try {
      formats = JSON.parse(formatsStr);
    } catch {
      formats = [DEFAULT_PLATE_FORMAT];
    }
  } else {
    // Check old single format key
    const oldFormatStr = localStorage.getItem(LEGACY_PLATE_FORMAT_KEY);
    if (oldFormatStr) {
      try {
        formats = [JSON.parse(oldFormatStr)];
      } catch {
        formats = [DEFAULT_PLATE_FORMAT];
      }
    }
  }
  return { enabled, formats };
}

export function savePlateFormatSettings(
  enabled: boolean,
  formats: PlateFormatBlock[][],
) {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      PLATE_VALIDATION_ENABLED_KEY,
      enabled ? "true" : "false",
    );
    localStorage.setItem(PLATE_FORMATS_KEY, JSON.stringify(formats));
  }
}

export function getFormatsPreview(formats: PlateFormatBlock[][]): string {
  return formats.map((fmt) => getFormatPreview(fmt)).join(" / ");
}

export function isValidPlate(plate: string): boolean {
  // Only ASCII alphanumeric characters and spaces allowed
  return /^[A-Za-z0-9\s]+$/.test(plate);
}

export function normalizePlate(plate: string): string {
  const clean = plate.replace(/\s+/g, "");
  return clean
    .replace(/([A-Za-z])(?=[0-9])/g, "$1 ")
    .replace(/([0-9])(?=[A-Za-z])/g, "$1 ")
    .toUpperCase();
}

export function validatePlateAgainstFormat(
  plate: string,
  format: PlateFormatBlock[],
): boolean {
  const clean = plate.replace(/\s+/g, "");

  let regexStr = "^";
  for (const block of format) {
    let charClass = "";
    if (block.type === "letters") {
      charClass = "[A-Za-z]";
    } else if (block.type === "numbers") {
      charClass = "[0-9]";
    } else if (block.type === "mixed") {
      charClass = "[A-Za-z0-9]";
    }

    const min = block.minLength;
    const max = block.maxLength;
    if (min === max) {
      regexStr += `${charClass}{${min}}`;
    } else {
      regexStr += `${charClass}{${min},${max}}`;
    }
  }
  regexStr += "$";

  try {
    const regex = new RegExp(regexStr);
    return regex.test(clean);
  } catch {
    return false;
  }
}

export function getFormatPreview(format: PlateFormatBlock[]): string {
  return format
    .map((block) => {
      const char =
        block.type === "letters" ? "A" : block.type === "numbers" ? "9" : "X";
      if (block.minLength === block.maxLength) {
        return char.repeat(block.minLength);
      }
      return `${char}{${block.minLength}-${block.maxLength}}`;
    })
    .join(" ");
}

export function mapNhtsaFuelType(nhtsaFuel: string): string {
  const f = nhtsaFuel.toLowerCase();
  if (f.includes("gasoline") || f.includes("petrol") || f.includes("benzine"))
    return "petrol";
  if (f.includes("diesel")) return "diesel";
  if (f.includes("hybrid")) return "hybrid";
  if (f.includes("electric")) return "electric";
  if (
    f.includes("lpg") ||
    f.includes("cng") ||
    f.includes("liquefied petroleum") ||
    f.includes("natural gas")
  )
    return "gas";
  return "other";
}

export function mapNhtsaDriveType(driveType: string): string {
  const d = driveType.toLowerCase();
  if (d.includes("front") || d.includes("fwd") || d.includes("4x2, front"))
    return "fwd";
  if (d.includes("rear") || d.includes("rwd") || d.includes("4x2, rear"))
    return "rwd";
  if (d.includes("all") || d.includes("awd")) return "awd";
  if (d.includes("4x4") || d.includes("4wd") || d.includes("four"))
    return "4wd";
  return "";
}

export function mapNhtsaTransmission(transStyle: string): string {
  const t = transStyle.toLowerCase();
  if (t.includes("manual")) return "manual";
  if (t.includes("cvt")) return "cvt";
  if (
    t.includes("dualclutch") ||
    t.includes("dct") ||
    t.includes("double clutch")
  )
    return "dct";
  if (t.includes("automatic")) return "automatic";
  return "";
}

export async function decodeVin(vin: string) {
  const cleanVin = vin.trim().toUpperCase();
  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`,
  );
  if (!response.ok) {
    throw new Error("Failed to decode VIN");
  }
  const data = await response.json();
  const results = data.Results || [];

  let make = "";
  let model = "";
  let year = "";
  let fuelType = "";
  let engineVolume = "";
  let enginePower = "";
  let driveType = "";
  let transStyle = "";
  let cylinders = "";
  let config = "";

  for (const item of results) {
    if (item.Variable === "Make") {
      make = item.Value || "";
    } else if (item.Variable === "Model") {
      model = item.Value || "";
    } else if (item.Variable === "Model Year") {
      year = item.Value || "";
    } else if (item.Variable === "Fuel Type - Primary") {
      fuelType = item.Value || "";
    } else if (item.Variable === "Displacement (L)") {
      engineVolume = item.Value || "";
    } else if (item.Variable === "Engine Brake (HP)") {
      enginePower = item.Value || "";
    } else if (item.Variable === "Drive Type") {
      driveType = item.Value || "";
    } else if (item.Variable === "Transmission Style") {
      transStyle = item.Value || "";
    } else if (item.Variable === "Engine Number of Cylinders") {
      cylinders = item.Value || "";
    } else if (item.Variable === "Engine Configuration") {
      config = item.Value || "";
    }
  }

  const parsedFuel = mapNhtsaFuelType(fuelType);
  let engineTypeStr = "";
  if (parsedFuel === "electric") {
    engineTypeStr = "Electric Motor";
  } else {
    const configShort = config.toLowerCase().includes("in-line")
      ? "I"
      : config.toLowerCase().includes("v-shaped") ||
          config.toLowerCase().includes("v")
        ? "V"
        : config;
    const cylPart = cylinders ? `${configShort}${cylinders}` : "";
    const dispPart = engineVolume ? `${parseFloat(engineVolume)}L` : "";
    engineTypeStr = [dispPart, cylPart].filter(Boolean).join(" ");
  }

  return {
    make: normalizeSmartCasing(make.trim()),
    model: normalizeSmartCasing(model.trim()),
    year: year ? parseInt(year) || undefined : undefined,
    fuelType: parsedFuel || undefined,
    engineVolume: engineVolume
      ? parseFloat(engineVolume) || undefined
      : undefined,
    enginePower: enginePower ? parseInt(enginePower) || undefined : undefined,
    drivetrain: mapNhtsaDriveType(driveType) || undefined,
    transmission: mapNhtsaTransmission(transStyle) || undefined,
    engineType: engineTypeStr || undefined,
  };
}

export function isValidVin(vin: string): boolean {
  // VIN is a standard 17-character alphanumeric string (excluding I, O, Q)
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

/**
 * Optimized binary search for prefix matching on a sorted array.
 * Fast O(log N) lookup instead of O(N) linear filtering.
 */
export function binarySearchPrefix<T>(
  sortedArr: T[],
  prefix: string,
  keySelector: (item: T) => string,
): T[] {
  if (!prefix) return sortedArr;
  const lowerPrefix = prefix.toLowerCase();

  let low = 0;
  let high = sortedArr.length - 1;
  let firstIndex = -1;

  // Binary search for the first occurrence
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = keySelector(sortedArr[mid]).toLowerCase();

    if (midVal.startsWith(lowerPrefix)) {
      firstIndex = mid;
      high = mid - 1; // Look left for earlier occurrences
    } else if (midVal < lowerPrefix) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (firstIndex === -1) return [];

  // Collect all matching items sequentially (since they are contiguous)
  const results: T[] = [];
  for (let i = firstIndex; i < sortedArr.length; i++) {
    if (keySelector(sortedArr[i]).toLowerCase().startsWith(lowerPrefix)) {
      results.push(sortedArr[i]);
    } else {
      break;
    }
  }

  return results;
}

/**
 * An optimized search index that tokenizes fields and builds a sorted array
 * to allow O(log N) prefix searches across multiple properties.
 */
export class MultiFieldSearchIndex<T> {
  private index: { term: string; item: T }[] = [];

  constructor(items: T[], termExtractor: (item: T) => string[]) {
    const rawIndex: { term: string; item: T }[] = [];
    for (const item of items) {
      const terms = termExtractor(item);
      for (const term of terms) {
        if (term) {
          // Split by spaces or dashes to index individual words/parts
          const words = term.toLowerCase().split(/[\s\-]+/);
          for (const word of words) {
            if (word) {
              rawIndex.push({ term: word, item });
            }
          }
          // Also index the full term just in case
          rawIndex.push({ term: term.toLowerCase(), item });
        }
      }
    }
    // Sort alphabetically for binary search
    this.index = rawIndex.sort((a, b) => a.term.localeCompare(b.term));
  }

  public search(query: string): T[] {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    // Split the query into words for order-independent matching
    const queryWords = cleanQuery.split(/[\s\-]+/);
    const resultSets: Set<T>[] = [];

    for (const word of queryWords) {
      if (!word) continue;

      // Use the optimized O(log N) binary search prefix finder for each word
      const matches = binarySearchPrefix(this.index, word, (x) => x.term);

      const wordSet = new Set<T>();
      for (const match of matches) {
        wordSet.add(match.item);
      }
      resultSets.push(wordSet);
    }

    if (resultSets.length === 0) return [];

    // Intersect the result sets so all query words must match
    let finalSet = resultSets[0];
    for (let i = 1; i < resultSets.length; i++) {
      const currentSet = resultSets[i];
      const nextSet = new Set<T>();
      for (const item of finalSet) {
        if (currentSet.has(item)) {
          nextSet.add(item);
        }
      }
      finalSet = nextSet;
      if (finalSet.size === 0) break; // Early exit if no intersection
    }

    return Array.from(finalSet);
  }
}
