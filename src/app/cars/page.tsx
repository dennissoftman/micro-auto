"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CarDetailContent from "./CarDetailContent";

function CarDetailWithParams() {
  const searchParams = useSearchParams();
  const carId = searchParams.get("id") || "";
  return <CarDetailContent carId={carId} />;
}

export default function CarDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <CarDetailWithParams />
    </Suspense>
  );
}
