import JSZip from "jszip";
import { db, type Car, type ImageAttachment, type MaintenanceEvent, type Owner } from "./db";

type BackupImageMetadata = Omit<ImageAttachment, "blob">;

type BackupData = {
  owners?: Array<Owner & { createdAt: string; updatedAt: string }>;
  cars?: Array<Car & { createdAt: string; updatedAt: string }>;
  maintenanceEvents?: Array<
    Omit<MaintenanceEvent, "date" | "createdAt" | "updatedAt"> & {
      date: string;
      createdAt: string;
      updatedAt?: string;
    }
  >;
  images?: Array<
    Omit<BackupImageMetadata, "createdAt" | "deletedAt"> & {
      createdAt: string;
      deletedAt?: string;
    }
  >;
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

const restoreOwners = (owners: BackupData["owners"] = []) =>
  owners.map((owner) => ({
    ...owner,
    createdAt: new Date(owner.createdAt),
    updatedAt: new Date(owner.updatedAt),
    deletedAt: owner.deletedAt ? new Date(owner.deletedAt) : undefined,
  }));

const restoreCars = (cars: BackupData["cars"] = []) =>
  cars.map((car) => ({
    ...car,
    createdAt: new Date(car.createdAt),
    updatedAt: new Date(car.updatedAt),
    deletedAt: car.deletedAt ? new Date(car.deletedAt) : undefined,
  }));

const restoreEvents = (events: BackupData["maintenanceEvents"] = []) =>
  events.map((event) => ({
    ...event,
    date: new Date(event.date),
    createdAt: new Date(event.createdAt),
    updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
    deletedAt: event.deletedAt ? new Date(event.deletedAt) : undefined,
  }));

export async function exportBackup() {
  const ownersList = await db.owners.toArray();
  const carsList = await db.cars.toArray();
  const maintenanceEvents = await db.maintenanceEvents.toArray();
  const imagesList = await db.images.toArray();

  const imagesMetadata = imagesList.map((img) => {
    const { blob, ...rest } = img;
    void blob;
    return rest;
  });

  const data = {
    version: 3,
    exportedAt: new Date().toISOString(),
    owners: ownersList,
    cars: carsList,
    maintenanceEvents,
    images: imagesMetadata,
  };

  const zip = new JSZip();
  zip.file("database.json", JSON.stringify(data, null, 2));

  const imagesFolder = zip.folder("images");
  if (imagesFolder) {
    imagesList.forEach((img) => {
      if (img.id && img.blob) {
        imagesFolder.file(img.id, img.blob);
      }
    });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  link.download = `micro-auto-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.zip`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File) {
  try {
    if (file.name.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const dbFile = zip.file("database.json");
      if (!dbFile) throw new Error("database.json not found in zip");

      const text = await dbFile.async("string");
      const data = JSON.parse(text) as BackupData;

      await db.transaction(
        "rw",
        db.owners,
        db.cars,
        db.maintenanceEvents,
        db.images,
        async () => {
          await db.owners.clear();
          await db.cars.clear();
          await db.maintenanceEvents.clear();
          await db.images.clear();

          if (data.owners) await db.owners.bulkAdd(restoreOwners(data.owners));
          if (data.cars) await db.cars.bulkAdd(restoreCars(data.cars));
          if (data.maintenanceEvents) {
            await db.maintenanceEvents.bulkAdd(
              restoreEvents(data.maintenanceEvents),
            );
          }

          if (data.images) {
            const imagesToRestore: ImageAttachment[] = [];
            for (const imgMeta of data.images) {
              const imgFile = zip.file(`images/${imgMeta.id}`);
              if (imgFile) {
                const blob = await imgFile.async("blob");
                imagesToRestore.push({
                  ...imgMeta,
                  blob,
                  createdAt: new Date(imgMeta.createdAt),
                  deletedAt: imgMeta.deletedAt
                    ? new Date(imgMeta.deletedAt)
                    : undefined,
                });
              }
            }
            await db.images.bulkAdd(imagesToRestore);
          }
        },
      );
      return;
    }

    const text = await file.text();
    const data = JSON.parse(text) as BackupData;

    if (!data.cars || !data.maintenanceEvents) {
      throw new Error("Invalid backup file structure.");
    }

    await db.transaction(
      "rw",
      db.owners,
      db.cars,
      db.maintenanceEvents,
      async () => {
        await db.owners.clear();
        await db.cars.clear();
        await db.maintenanceEvents.clear();

        if (data.owners) await db.owners.bulkAdd(restoreOwners(data.owners));
        await db.cars.bulkAdd(restoreCars(data.cars));
        await db.maintenanceEvents.bulkAdd(
          restoreEvents(data.maintenanceEvents),
        );
      },
    );
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}
