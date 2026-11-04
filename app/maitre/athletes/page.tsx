import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { AthletesManagement } from "./athletes-management";

export default function AthletesPage() {
  return (
    <Suspense fallback={<SkeletonList count={4} className="p-4 md:p-8" />}>
      <AthletesManagement />
    </Suspense>
  );
}
