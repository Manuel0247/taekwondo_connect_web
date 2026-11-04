import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { ProposeAthletes } from "./propose-athletes";

export default function MaitreEventDetailPage({ params }: PageProps<"/maitre/evenements/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <ProposeAthletes id={id} />
      ))}
    </Suspense>
  );
}
