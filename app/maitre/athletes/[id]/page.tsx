import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { AthleteDetail } from "./athlete-detail";

export default function MaitreAthleteDetailPage({ params }: PageProps<"/maitre/athletes/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <AthleteDetail id={id} />
      ))}
    </Suspense>
  );
}
