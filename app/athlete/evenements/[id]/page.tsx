import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { AthleteEventDetail } from "./event-detail";

export default function EventDetailPage({ params }: PageProps<"/athlete/evenements/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <AthleteEventDetail id={id} />
      ))}
    </Suspense>
  );
}
