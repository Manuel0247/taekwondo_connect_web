import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { ClubDetail } from "./club-detail";

export default function ClubDetailPage({ params }: PageProps<"/athlete/clubs/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <ClubDetail id={id} />
      ))}
    </Suspense>
  );
}
