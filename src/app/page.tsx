import { Suspense } from "react";
import BitcoinProfitCalculator from "../../components/bitcoin";

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <BitcoinProfitCalculator />
    </Suspense>
  );
}