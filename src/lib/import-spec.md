# µAuto JSON Import Specification

This document describes the JSON structure expected for importing client and car data, such as when migrating from an Excel spreadsheet.

To import data properly, convert your spreadsheet into an array of objects matching the `ImportBackupFormat` schema.

## Schema Definition

```typescript
export interface ImportBackupFormat {
  version: string; // e.g. "1.0"
  owners: ImportOwner[];
  cars: ImportCar[];
  maintenanceEvents?: ImportMaintenanceEvent[];
}

export interface ImportOwner {
  id: string; // Unique identifier (can be a UUID or a string from Excel like "owner_1")
  name: string; // Full name of the client
  phone?: string; // Contact phone number (optional)
}

export interface ImportCar {
  id: string; // Unique identifier for the car
  ownerId: string; // Must match an `id` from the owners array
  licensePlate: string; // Required, e.g. "ABC-1234"
  make: string; // Required, e.g. "Toyota"
  model: string; // Required, e.g. "Camry"
  year?: number; // e.g. 2018
  vin?: string; // 17-character VIN
  modification?: string; // e.g. "2.0 MT"
  edition?: string; // e.g. "SE"
  notes?: string;
  fuelType?: "petrol" | "diesel" | "hybrid" | "electric" | "gas" | "other";
  engineVolume?: number; // e.g. 2.5
  enginePower?: number; // in HP
  engineType?: string; // e.g. "V6"
  transmission?:
    | "automatic"
    | "manual"
    | "cvt"
    | "dct"
    | "direct_drive"
    | "other";
  drivetrain?: "fwd" | "rwd" | "awd" | "4wd";
}

export interface ImportReplacedItem {
  name: string;
  quantity?: string;
  isPaid?: boolean;
  price?: number;
  currency?: "USD" | "native";
}

export interface ImportMaintenanceEvent {
  id?: number;
  carId: string; // Must match an `id` from the cars array
  type:
    | "Oil Change"
    | "Brake Pad Replacement"
    | "Filter Change"
    | "Inspection"
    | "Repair"
    | "Other";
  date: string; // ISO 8601 format, e.g., "2023-10-12T00:00:00.000Z"
  mileage?: number;
  symptoms?: string;
  diagnosticNotes?: string;
  fixesApplied?: string;
  cost?: number;
  currency?: "USD" | "native";
  replacedItems?: ImportReplacedItem[];
  paymentStatus?: "paid" | "unpaid" | "partially_paid";
  paidAmount?: number;
  recommendations?: string;
}
```

## Example JSON File

```json
{
  "version": "1.0",
  "owners": [
    {
      "id": "owner_1",
      "name": "John Doe",
      "phone": "+1 555-0198"
    },
    {
      "id": "owner_2",
      "name": "Jane Smith"
    }
  ],
  "cars": [
    {
      "id": "car_1",
      "ownerId": "owner_1",
      "licensePlate": "XYZ-9876",
      "make": "Honda",
      "model": "Civic",
      "year": 2020,
      "fuelType": "petrol",
      "transmission": "automatic"
    },
    {
      "id": "car_2",
      "ownerId": "owner_2",
      "licensePlate": "LMN-4567",
      "make": "Ford",
      "model": "Mustang",
      "year": 2018,
      "enginePower": 460
    }
  ],
  "maintenanceEvents": [
    {
      "carId": "car_1",
      "type": "Oil Change",
      "date": "2024-01-15T10:00:00Z",
      "fixesApplied": "Replaced synthetic oil and filter.",
      "cost": 85,
      "currency": "USD",
      "paymentStatus": "paid",
      "replacedItems": [
        {
          "name": "Synthetic Engine Oil",
          "quantity": "4.5L",
          "isPaid": true,
          "price": 60,
          "currency": "USD"
        },
        {
          "name": "Oil Filter",
          "quantity": "1",
          "isPaid": true,
          "price": 25,
          "currency": "USD"
        }
      ],
      "recommendations": "Next oil change in 10000km or 12mo."
    }
  ]
}
```

## Migration Instructions

1. Format your Excel file to contain tabs for `Owners`, `Cars`, and `Maintenance` (optional).
2. Use a script or an online converter (like Excel to JSON) to convert each sheet to a JSON array.
3. Assemble the arrays into the `ImportBackupFormat` object shown above.
4. Provide the resulting `.json` file to the import utility in the µAuto application.
