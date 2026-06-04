"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  type Car,
  type MaintenanceEvent,
  type Owner,
  type ImageAttachment,
} from "./db";
import { generateUUID } from "./utils";
import { OwnerSchema, CarSchema, MaintenanceEventSchema } from "./validators";

// Owners Hooks
export function useOwners() {
  return useLiveQuery(() => db.owners.toArray());
}

export function useOwner(id: string) {
  return useLiveQuery(() => db.owners.get(id), [id]);
}

export async function addOwner(
  owner: Omit<Owner, "id" | "createdAt" | "updatedAt">,
) {
  const parsed = OwnerSchema.parse(owner);
  return db.owners.add({
    ...(parsed as any),
    id: generateUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateOwner(
  id: string,
  changes: Partial<Omit<Owner, "id">>,
) {
  const parsed = OwnerSchema.partial().parse(changes);
  return db.owners.update(id, {
    ...parsed,
    updatedAt: new Date(),
  });
}

// Cars Hooks
export function useCars() {
  return useLiveQuery(() => db.cars.toArray());
}

export function useCar(id: string) {
  return useLiveQuery(() => db.cars.get(id), [id]);
}

export async function addCar(car: Omit<Car, "id" | "createdAt" | "updatedAt">) {
  const parsed = CarSchema.parse(car);
  return db.cars.add({
    ...(parsed as any),
    id: generateUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateCar(id: string, changes: Partial<Omit<Car, "id">>) {
  const parsed = CarSchema.partial().parse(changes);
  return db.cars.update(id, {
    ...parsed,
    updatedAt: new Date(),
  });
}

export async function deleteCar(id: string) {
  return db.transaction(
    "rw",
    db.cars,
    db.maintenanceEvents,
    db.images,
    async () => {
      await db.maintenanceEvents.where("carId").equals(id).delete();
      await db.images
        .where("[entityType+entityId]")
        .equals(["car", id])
        .delete();
      await db.cars.delete(id);
    },
  );
}

// Maintenance Events Hooks
export function useMaintenanceEvents(carId?: string) {
  return useLiveQuery(
    () =>
      carId
        ? db.maintenanceEvents
            .where("carId")
            .equals(carId)
            .reverse()
            .sortBy("date")
        : db.maintenanceEvents.orderBy("date").reverse().toArray(),
    [carId],
  );
}

export async function addMaintenanceEvent(
  event: Omit<MaintenanceEvent, "id" | "createdAt">,
) {
  const parsed = MaintenanceEventSchema.parse(event);
  return db.maintenanceEvents.add({
    ...(parsed as any),
    createdAt: new Date(),
  });
}

export async function updateMaintenanceEvent(
  id: number,
  changes: Partial<Omit<MaintenanceEvent, "id">>,
) {
  const parsed = MaintenanceEventSchema.partial().parse(changes);
  return db.maintenanceEvents.update(id, parsed);
}

export async function deleteMaintenanceEvent(id: number) {
  return db.transaction("rw", db.maintenanceEvents, db.images, async () => {
    await db.images
      .where("[entityType+entityId]")
      .equals(["maintenanceEvent", id])
      .delete();
    await db.maintenanceEvents.delete(id);
  });
}

// Image Hooks
export function useImages(
  entityId: string | number | undefined,
  entityType: "car" | "maintenanceEvent",
) {
  return useLiveQuery(() => {
    if (entityId === undefined) return Promise.resolve([] as ImageAttachment[]);
    return db.images
      .where("[entityType+entityId]")
      .equals([entityType, entityId])
      .toArray();
  }, [entityId, entityType]);
}

export async function addImage(
  file: File,
  entityId: string | number,
  entityType: "car" | "maintenanceEvent",
) {
  return db.images.add({
    id: generateUUID(),
    entityId,
    entityType,
    blob: file,
    name: file.name,
    size: file.size,
    type: file.type,
    createdAt: new Date(),
  });
}

export async function deleteImage(id: string) {
  return db.images.delete(id);
}

// Autocomplete Hooks
export function useAutocompleteSuggestions() {
  return (
    useLiveQuery(async () => {
      const events = await db.maintenanceEvents.toArray();
      const itemNames = new Set<string>();
      const recommendations = new Set<string>();

      events.forEach((event) => {
        if (event.replacedItems) {
          event.replacedItems.forEach((item) => {
            if (item.name) itemNames.add(item.name.trim());
          });
        }
        if (event.recommendations) {
          recommendations.add(event.recommendations.trim());
        }
      });

      return {
        itemNames: Array.from(itemNames).filter(Boolean).sort(),
        recommendations: Array.from(recommendations).filter(Boolean).sort(),
      };
    }, []) || { itemNames: [], recommendations: [] }
  );
}
