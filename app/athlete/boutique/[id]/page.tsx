import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/display";
import { ProductScreen } from "@/components/screens/boutique";

export default function AthleteProductPage({ params }: PageProps<"/athlete/boutique/[id]">) {
  return (
    <Suspense fallback={<SkeletonList count={3} className="p-4" />}>
      {params.then(({ id }) => (
        <ProductScreen base="/athlete" id={id} accent="primary" />
      ))}
    </Suspense>
  );
}
