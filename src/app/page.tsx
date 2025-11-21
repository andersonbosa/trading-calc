import { CryptoProfitCalculator } from "@/components/crypto-profit-calculator"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CryptoProfitCalculator />
    </Suspense>
  )
}