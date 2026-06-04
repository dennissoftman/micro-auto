import { z } from "zod";

export const OwnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional(),
});

export const CarSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string(),
  licensePlate: z.string().min(1, "License plate is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().optional(),
  modification: z.string().optional(),
  edition: z.string().optional(),
  notes: z.string().optional(),
  vin: z.string().optional(),
  fuelType: z.string().optional(),
  engineVolume: z.number().optional(),
  enginePower: z.number().optional(),
  engineType: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional(),
});

const ReplacedItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.string().optional(),
  isPaid: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "native"]).optional(),
});

export const MaintenanceEventSchema = z.object({
  id: z.number().optional(),
  carId: z.string(),
  type: z.enum([
    "Oil Change",
    "Brake Pad Replacement",
    "Filter Change",
    "Inspection",
    "Repair",
    "Other",
  ]),
  date: z.date(),
  mileage: z.number().nonnegative().optional(),
  symptoms: z.string().optional(),
  diagnosticNotes: z.string().optional(),
  fixesApplied: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "native"]).optional(),
  replacedItems: z.array(ReplacedItemSchema).optional(),
  paymentStatus: z.enum(["paid", "unpaid", "partially_paid"]).optional(),
  paidAmount: z.number().nonnegative().optional(),
  recommendations: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional(),
});
