'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatePresence, motion } from "framer-motion"
import { Copy, Check } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

let throttleTimeout: NodeJS.Timeout

const PERCENTAGE_LEVELS = [
    { label: '-10%', value: -10 },
    { label: '-5%', value: -5 },
    { label: '-3%', value: -3 },
    { label: '-2%', value: -2 },
    { label: '-1%', value: -1 },
    { label: '-0.5%', value: -0.5 },
    { label: 'Base', value: 0 },
    { label: '+0.5%', value: 0.5 },
    { label: '+1%', value: 1 },
    { label: '+2%', value: 2 },
    { label: '+3%', value: 3 },
    { label: '+5%', value: 5 },
    { label: '+10%', value: 10 },
]

export default function QuickMath() {
    const [basePrice, setBasePrice] = useState(100)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const calculateLevel = (percent: number): number => {
        return basePrice * (1 + percent / 100)
    }

    const copyToClipboard = (value: number, index: number) => {
        navigator.clipboard.writeText(value.toFixed(2)).then(() => {
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        })
    }

    return (
        <Card className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
            <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Níveis Rápidos</h2>

                <div className="space-y-6">
                    <div>
                        <Label>Preço Base (USD)</Label>
                        <Input
                            placeholder="Ex: 100"
                            type="number"
                            value={basePrice}
                            onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                            min={0}
                            step={0.01}
                        />
                        <p className="text-xs text-neutral-400 mt-1">
                            Digite o preço base para calcular os níveis de porcentagem rapidamente.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <AnimatePresence>
                            {PERCENTAGE_LEVELS.map((level, index) => {
                                const calculatedPrice = calculateLevel(level.value)
                                const isBase = level.value === 0
                                const isPositive = level.value > 0
                                const isNegative = level.value < 0

                                return (
                                    <motion.div
                                        key={level.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`
                                            p-4 rounded-lg border cursor-pointer transition-all
                                            ${isBase
                                                ? 'bg-primary/20 border-primary/50 hover:bg-primary/30'
                                                : isPositive
                                                    ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                                                    : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                                            }
                                        `}
                                        onClick={() => copyToClipboard(calculatedPrice, index)}
                                    >
                                        <div className="text-xs text-neutral-400 mb-1">
                                            {level.label}
                                        </div>
                                        <div className={`
                                            text-lg font-semibold mb-2
                                            ${isBase ? 'text-primary' : isPositive ? 'text-green-400' : 'text-red-400'}
                                        `}>
                                            ${calculatedPrice.toFixed(2)}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-neutral-500">
                                                {level.value !== 0 && (
                                                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                                                        {isPositive ? '+' : ''}{level.value}%
                                                    </span>
                                                )}
                                            </span>
                                            {copiedIndex === index ? (
                                                <Check className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-neutral-500" />
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg">
                        <p className="text-xs text-neutral-400">
                            <strong className="text-white">Dica:</strong> Clique em qualquer nível para copiar o valor para a área de transferência.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

