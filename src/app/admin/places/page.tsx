import { Suspense } from "react";
import AdminPlacesV2 from "@/components/AdminPlacesV2";

export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Caricamento pannello Admin...</main>}>
      <AdminPlacesV2 />
    </Suspense>
  );
}
