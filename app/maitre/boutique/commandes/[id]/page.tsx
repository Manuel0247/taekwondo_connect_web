import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { OrderScreen } from "@/components/screens/boutique";

export default function MaitreOrderPage({ params }: PageProps<"/maitre/boutique/commandes/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <OrderScreen base="/maitre" id={id} accent="secondary" />
      ))}
    </Suspense>
  );
}
