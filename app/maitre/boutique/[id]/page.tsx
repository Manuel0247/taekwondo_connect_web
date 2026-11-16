import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { ProductScreen } from "@/components/screens/boutique";

export default function MaitreProductPage({ params }: PageProps<"/maitre/boutique/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <ProductScreen base="/maitre" id={id} accent="secondary" />
      ))}
    </Suspense>
  );
}
