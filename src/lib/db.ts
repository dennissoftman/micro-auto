import Dexie, { type Table } from "dexie";

export interface Owner {
  id?: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Car {
  id?: string;
  ownerId: string;
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  modification?: string;
  edition?: string;
  notes?: string;
  vin?: string;
  fuelType?: string;
  engineVolume?: number;
  enginePower?: number;
  engineType?: string;
  transmission?: string;
  drivetrain?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ReplacedItem {
  name: string;
  quantity?: string; // e.g. "4", "4.5L"
  isPaid?: boolean;
  price?: number;
  currency?: "USD" | "native";
}

export interface MaintenanceEvent {
  id?: number;
  carId: string;
  type:
    | "Oil Change"
    | "Brake Pad Replacement"
    | "Filter Change"
    | "Inspection"
    | "Repair"
    | "Other";
  date: Date;
  mileage?: number;
  symptoms?: string;
  diagnosticNotes?: string;
  fixesApplied?: string;
  cost?: number;
  currency?: "USD" | "native";
  replacedItems?: ReplacedItem[];
  paymentStatus?: "paid" | "unpaid" | "partially_paid";
  paidAmount?: number;
  recommendations?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ImageAttachment {
  id?: string;
  entityId: string | number;
  entityType: "car" | "maintenanceEvent";
  blob: Blob;
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  deletedAt?: Date;
}

export interface SyncMetadata {
  id: string; // usually "default"
  lastSyncTimestamp: number;
  userToken?: string;
}

export class MicroAutoDatabase extends Dexie {
  owners!: Table<Owner, string>;
  cars!: Table<Car, string>;
  maintenanceEvents!: Table<MaintenanceEvent, number>;
  images!: Table<ImageAttachment, string>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super("MicroAutoDB");

    this.version(1).stores({
      owners: "id, name, phone",
      cars: "id, ownerId, licensePlate",
      maintenanceEvents: "++id, carId, date, type",
    });

    this.version(2).stores({
      images: "id, entityId, entityType, [entityType+entityId]",
    });

    this.version(3).stores({
      syncMetadata: "id",
    });

    this.version(4).stores({
      maintenanceEvents: "++id, carId, date, type, paymentStatus, [carId+date]",
    });
  }
}

export const db = new MicroAutoDatabase();
