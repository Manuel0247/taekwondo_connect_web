import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { TechniqueDetail } from "./technique-detail";

export default function TechniqueDetailPage({ params }: PageProps<"/athlete/techniques/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={2} className="p-4" />}>
      {params.then(({ id }) => (
        <TechniqueDetail id={id} />
      ))}
    </Suspense>
  );
}
