'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react"
import { useState } from "react"

export default function BitcoinProfitCalculator() {
    const [mode, setMode] = useState("btc")
    const [btcAmount, setBtcAmount] = useState(0.1)
    const [usdAmount, setUsdAmount] = useState(1000)
    const [buyPrice, setBuyPrice] = useState(74000)
    const [sellPrice, setSellPrice] = useState(84000)
    const [feePercent, setFeePercent] = useState(0.1)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<any>(null)

    const calculate = () => {
        setError(null)

        if (
            (mode === "btc" && btcAmount <= 0) ||
            (mode === "usd" && usdAmount <= 0) ||
            buyPrice <= 0 ||
            sellPrice <= 0 ||
            feePercent < 0
        ) {
            setError("Verifique se todos os valores são válidos e positivos.")
            setResult(null)
            return
        }

        const amountBtc =
            mode === "btc"
                ? btcAmount
                : (usdAmount / buyPrice) * (1 - feePercent * 0.01)

        const buyValue = amountBtc * buyPrice
        const buyFee = buyValue * (feePercent * 0.01)
        const buyTotal = buyValue + buyFee

        const sellValue = amountBtc * sellPrice
        const sellFee = sellValue * (feePercent * 0.01)
        const sellNet = sellValue - sellFee

        const profitGross = sellValue - buyValue
        const profitNet = sellNet - buyTotal
        const returnOnInvestment = (profitNet / buyTotal) * 100

        setResult({
            btc: amountBtc,
            buyValue,
            buyFee,
            buyTotal,
            sellValue,
            sellFee,
            sellNet,
            profitGross,
            profitNet,
            returnOnInvestment,
        })
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6 bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">Calculadora de Lucro Bitcoin</h2>

                <RadioGroup
                    value={mode}
                    onValueChange={setMode}
                    className="flex justify-center gap-6 mb-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="btc" id="r1" />
                        <Label htmlFor="r1">Calcular com BTC</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="usd" id="r2" />
                        <Label htmlFor="r2">Calcular com USD</Label>
                    </div>
                </RadioGroup>

                <div className="grid gap-4">
                    {mode === "btc" ? (
                        <div>
                            <Label className="flex items-center gap-2">
                                Quantidade de BTC
                                <Tooltip>
                                    <TooltipTrigger><AlertCircle className="w-4 h-4" /></TooltipTrigger>
                                    <TooltipContent>Quantidade que você já possui para vender</TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input
                                placeholder="Ex: 0.015"
                                type="number"
                                value={btcAmount}
                                onChange={(e) => setBtcAmount(parseFloat(e.target.value))}
                                min={0}
                                step={0.00001}
                            />
                        </div>
                    ) : (
                        <div>
                            <Label className="flex items-center gap-2">
                                Valor em USD para comprar BTC
                                <Tooltip>
                                    <TooltipTrigger><AlertCircle className="w-4 h-4" /></TooltipTrigger>
                                    <TooltipContent>Quanto você quer investir para comprar BTC</TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input
                                placeholder="Ex: 1500"
                                type="number"
                                value={usdAmount}
                                onChange={(e) => setUsdAmount(parseFloat(e.target.value))}
                                min={0}
                            />
                        </div>
                    )}

                    <div>
                        <Label>Preço de Compra (USD)</Label>
                        <Input
                            placeholder="Ex: 95000"
                            type="number"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(parseFloat(e.target.value))}
                            min={0}
                        />
                    </div>
                    <div>
                        <Label>Preço de Venda (USD)</Label>
                        <Input
                            placeholder="Ex: 99000"
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(parseFloat(e.target.value))}
                            min={0}
                        />
                    </div>
                    <div>
                        <Label>Taxa da Corretora (%)</Label>
                        <Input
                            placeholder="Ex: 0.1"
                            type="number"
                            value={feePercent}
                            onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                            min={0}
                            step={0.01}
                        />
                    </div>
                </div>

                <Button
                    onClick={calculate}
                    className="w-full mt-6"
                    disabled={
                        mode === "btc"
                            ? btcAmount <= 0
                            : usdAmount <= 0 || buyPrice <= 0 || sellPrice <= 0
                    }
                >
                    Calcular Lucro
                </Button>

                {error && (
                    <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
                )}

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <CardContent className="mt-8 space-y-4 text-sm">
                                <div className="text-center text-xl font-semibold">
                                    {result.profitNet >= 0 ? (
                                        <div className="text-green-400 flex items-center justify-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            +${result.profitNet.toFixed(2)} de lucro líquido
                                        </div>
                                    ) : (
                                        <div className="text-red-400 flex items-center justify-center gap-2">
                                            <TrendingDown className="w-5 h-5" />
                                            -${Math.abs(result.profitNet).toFixed(2)} de prejuízo
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t pt-4 border-neutral-800">
                                    <span className="text-neutral-400">BTC negociado:</span>
                                    <span>{result.btc.toFixed(5)} BTC</span>
                                    <span className="text-neutral-400">Total investido:</span>
                                    <span>${result.buyTotal.toFixed(2)}</span>
                                    <span className="text-neutral-400">Receita líquida:</span>
                                    <span>${result.sellNet.toFixed(2)}</span>
                                    <span className="text-neutral-400">ROI:</span>
                                    <span>{result.returnOnInvestment.toFixed(2)}%</span>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    )
}
