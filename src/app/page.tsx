import BitcoinProfitCalculator from "@/components/bitcoin"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <BitcoinProfitCalculator />
    </Suspense>
  )
}