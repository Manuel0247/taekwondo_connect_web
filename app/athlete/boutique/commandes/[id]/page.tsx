import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { OrderScreen } from "@/components/screens/boutique";

export default function AthleteOrderPage({ params }: PageProps<"/athlete/boutique/commandes/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <OrderScreen base="/athlete" id={id} accent="primary" />
      ))}
    </Suspense>
  );
}
