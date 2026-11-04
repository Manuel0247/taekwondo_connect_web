import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { CourseReservations } from "./course-reservations";

export default function CourseReservationsPage({ params }: PageProps<"/maitre/cours/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <CourseReservations id={id} />
      ))}
    </Suspense>
  );
}
