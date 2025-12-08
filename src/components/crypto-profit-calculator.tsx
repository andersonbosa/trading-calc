'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"
import { HelpCircle, History, Repeat, Share2, TrendingDown, TrendingUp } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface CalculatorState {
    mode: "quantity" | "usd" | "crypto" | "btc" // "crypto" e "btc" para compatibilidade
    quantity?: number // Quantidade do ativo
    cryptoAmount?: number // Compatibilidade
    usdAmount: number
    buyPrice: number
    sellPrice: number
    buyFeePercent?: number
    sellFeePercent?: number
    // Compatibilidade com versões antigas
    btcAmount?: number
    feePercent?: number
    cryptoName?: string // Mantido apenas para compatibilidade
}

interface CalculationResult {
    quantity: number
    buyValue: number
    buyFee: number
    buyTotal: number
    sellValue: number
    sellFee: number
    sellNet: number
    profitGross: number
    profitNet: number
    returnOnInvestment: number
    // Compatibilidade
    cryptoAmount?: number
    btc?: number
}

interface HistoryEntry extends CalculatorState {
    result: CalculationResult
    timestamp: number
}

const STORAGE_KEY = 'profit-calc-state'

export function ProfitCalculator() {
    const [mode, setMode] = useState<"quantity" | "usd">("quantity")
    const [quantity, setQuantity] = useState(0.1)
    const [usdAmount, setUsdAmount] = useState(1000)
    const [buyPrice, setBuyPrice] = useState(95000)
    const [sellPrice, setSellPrice] = useState(99000)
    const [buyFeePercent, setBuyFeePercent] = useState(0.1)
    const [sellFeePercent, setSellFeePercent] = useState(0.1)
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [usdToBrl, setUsdToBrl] = useState<number | null>(null)

    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const searchParams = useSearchParams()

    // Buscar cotação do dólar
    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const response = await fetch('https://cdn.moneyconvert.net/api/latest.json')
                const data = await response.json()
                if (data.rates && data.rates.BRL) {
                    setUsdToBrl(data.rates.BRL)
                }
            } catch (error) {
                console.error('Erro ao buscar cotação do dólar:', error)
                // Fallback para uma cotação padrão caso a API falhe
                setUsdToBrl(5.0)
            }
        }
        fetchExchangeRate()
    }, [])

    // Formatação de números
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatCurrencyBRL = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatPercent = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    }

    const formatQuantity = (value: number) => {
        // Ajustar casas decimais baseado no valor
        const decimals = value < 0.01 ? 8 : value < 1 ? 6 : 4
        return value.toFixed(decimals)
    }

    // Carregar estados salvos do localStorage na inicialização
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState)
                // Migrar modos antigos para o novo formato
                const normalizedMode = parsed.mode === "btc" || parsed.mode === "crypto" ? "quantity" : parsed.mode || "quantity"
                setMode(normalizedMode)
                // Suportar tanto quantity quanto cryptoAmount/btcAmount para compatibilidade
                const qty = parsed.quantity ?? parsed.cryptoAmount ?? parsed.btcAmount ?? 0.1
                setQuantity(qty)
                if (parsed.usdAmount !== undefined) setUsdAmount(parsed.usdAmount)
                if (parsed.buyPrice !== undefined) setBuyPrice(parsed.buyPrice)
                if (parsed.sellPrice !== undefined) setSellPrice(parsed.sellPrice)
                if (parsed.buyFeePercent !== undefined) setBuyFeePercent(parsed.buyFeePercent)
                if (parsed.sellFeePercent !== undefined) setSellFeePercent(parsed.sellFeePercent)
            } catch (err) {
                console.error("Erro ao carregar estado salvo", err)
            }
        }
        setIsInitialized(true)
    }, [])

    // Salvar estados no localStorage sempre que mudarem (após inicialização)
    useEffect(() => {
        if (!isInitialized) return // Não salvar durante a inicialização
        
        const stateToSave = {
            mode,
            quantity,
            usdAmount,
            buyPrice,
            sellPrice,
            buyFeePercent,
            sellFeePercent,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    }, [isInitialized, mode, quantity, usdAmount, buyPrice, sellPrice, buyFeePercent, sellFeePercent])

    // Carregar histórico do localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('crypto-calc-history')
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory)
                // Migrar histórico antigo
                const migrated = parsed.map((entry: any) => ({
                    ...entry,
                    quantity: entry.quantity ?? entry.cryptoAmount ?? entry.btcAmount ?? 0,
                    cryptoAmount: entry.quantity ?? entry.cryptoAmount ?? entry.btcAmount ?? 0, // Compatibilidade
                    mode: entry.mode === "btc" || entry.mode === "crypto" ? "quantity" : entry.mode || "quantity",
                }))
                setHistory(migrated)
            } catch (err) {
                console.error("Erro ao carregar histórico", err)
            }
        }
    }, [])

    // Salvar histórico no localStorage
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem('crypto-calc-history', JSON.stringify(history.slice(-10))) // Últimos 10
        }
    }, [history])

    const calculateFromState = useCallback((state: CalculatorState) => {
        // Suportar modos antigos e novo modo
        const isQuantityMode = state.mode === "quantity" || state.mode === "crypto" || state.mode === "btc"
        
        let amount: number
        let buyValue: number
        let buyFee: number
        let buyTotal: number

        if (isQuantityMode) {
            // Modo quantidade: usuário já tem a quantidade do ativo
            amount = state.quantity ?? state.cryptoAmount ?? state.btcAmount ?? 0
            buyValue = amount * state.buyPrice
            buyFee = buyValue * ((state.buyFeePercent ?? state.feePercent ?? 0.1) * 0.01)
            buyTotal = buyValue + buyFee
        } else {
            // Modo USD: usuário tem um valor em USD para investir
            // Primeiro calculamos quantas unidades podemos comprar com o valor disponível
            // Considerando que a taxa será cobrada sobre o valor total
            // buyTotal = buyValue + buyFee
            // buyTotal = buyValue + (buyValue * feePercent)
            // buyTotal = buyValue * (1 + feePercent)
            // buyValue = buyTotal / (1 + feePercent)
            // Como buyValue = amount * buyPrice e temos buyTotal = usdAmount:
            // amount * buyPrice = usdAmount / (1 + feePercent)
            // amount = usdAmount / (buyPrice * (1 + feePercent))
            const feePercent = (state.buyFeePercent ?? state.feePercent ?? 0.1) * 0.01
            amount = state.usdAmount / (state.buyPrice * (1 + feePercent))
            buyValue = amount * state.buyPrice
            buyFee = buyValue * feePercent
            buyTotal = buyValue + buyFee
        }

        const sellValue = amount * state.sellPrice
        const sellFee = sellValue * ((state.sellFeePercent ?? state.feePercent ?? 0.1) * 0.01)
        const sellNet = sellValue - sellFee

        const profitGross = sellValue - buyValue
        const profitNet = sellNet - buyTotal
        const returnOnInvestment = buyTotal > 0 ? (profitNet / buyTotal) * 100 : 0

        const calculationResult: CalculationResult = {
            quantity: amount,
            cryptoAmount: amount, // Compatibilidade
            btc: amount, // Compatibilidade
            buyValue,
            buyFee,
            buyTotal,
            sellValue,
            sellFee,
            sellNet,
            profitGross,
            profitNet,
            returnOnInvestment,
        }

        setResult(calculationResult)
        return calculationResult
    }, [])

    // Carregar estado compartilhado da URL
    useEffect(() => {
        const shared = searchParams.get("share")
        if (shared) {
            try {
                const decoded: CalculatorState = JSON.parse(atob(shared))
                const normalizedMode = decoded.mode === "btc" || decoded.mode === "crypto" ? "quantity" : decoded.mode || "quantity"
                const normalizedState: CalculatorState = {
                    ...decoded,
                    mode: normalizedMode,
                    quantity: decoded.quantity ?? decoded.cryptoAmount ?? decoded.btcAmount ?? 0.1,
                    cryptoAmount: decoded.quantity ?? decoded.cryptoAmount ?? decoded.btcAmount ?? 0.1, // Compatibilidade
                }
                setMode(normalizedMode)
                setQuantity(normalizedState.quantity ?? 0.1)
                setUsdAmount(normalizedState.usdAmount)
                setBuyPrice(normalizedState.buyPrice)
                setSellPrice(normalizedState.sellPrice)
                setBuyFeePercent(normalizedState.buyFeePercent ?? normalizedState.feePercent ?? 0.1)
                setSellFeePercent(normalizedState.sellFeePercent ?? normalizedState.feePercent ?? 0.1)
                calculateFromState(normalizedState)
            } catch (err) {
                console.error("Erro ao decodificar URL compartilhada", err)
            }
        }
    }, [searchParams, calculateFromState])

    const throttledCalculate = useCallback(() => {
        if (throttleTimeoutRef.current) {
            clearTimeout(throttleTimeoutRef.current)
        }

        throttleTimeoutRef.current = setTimeout(() => {
            const isValid =
                buyPrice > 0 &&
                sellPrice > 0 &&
                ((mode === "quantity" && quantity > 0) || (mode === "usd" && usdAmount > 0))

            if (isValid) {
                const state: CalculatorState = {
                    mode,
                    quantity,
                    cryptoAmount: quantity, // Compatibilidade
                    usdAmount,
                    buyPrice,
                    sellPrice,
                    buyFeePercent,
                    sellFeePercent,
                }
                const calculationResult = calculateFromState(state)

                // Adicionar ao histórico
                setHistory((prev) => [
                    {
                        ...state,
                        result: calculationResult,
                        timestamp: Date.now(),
                    },
                    ...prev.slice(0, 9), // Manter apenas os últimos 10
                ])
            } else {
                setResult(null)
            }
        }, 300)
    }, [mode, quantity, usdAmount, buyPrice, sellPrice, buyFeePercent, sellFeePercent, calculateFromState])

    useEffect(() => {
        throttledCalculate()
        return () => {
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current)
            }
        }
    }, [throttledCalculate])

    const shareUrl = () => {
        const state: CalculatorState = {
            mode,
            quantity,
            cryptoAmount: quantity, // Compatibilidade
            usdAmount,
            buyPrice,
            sellPrice,
            buyFeePercent,
            sellFeePercent,
        }
        const encoded = btoa(JSON.stringify(state))
        const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`
        navigator.clipboard.writeText(url).then(() => {
            // Melhor feedback visual
            const button = document.activeElement as HTMLElement
            const originalText = button.textContent
            button.textContent = "✓ Link copiado!"
            setTimeout(() => {
                button.textContent = originalText
            }, 2000)
        })
    }

    const swapPrices = () => {
        const temp = buyPrice
        setBuyPrice(sellPrice)
        setSellPrice(temp)
    }

    const loadFromHistory = (entry: HistoryEntry) => {
        const normalizedMode = entry.mode === "btc" || entry.mode === "crypto" ? "quantity" : entry.mode || "quantity"
        setMode(normalizedMode)
        const qty = entry.quantity ?? entry.cryptoAmount ?? entry.btcAmount ?? 0
        setQuantity(qty)
        setUsdAmount(entry.usdAmount)
        setBuyPrice(entry.buyPrice)
        setSellPrice(entry.sellPrice)
        setBuyFeePercent(entry.buyFeePercent ?? entry.feePercent ?? 0.1)
        setSellFeePercent(entry.sellFeePercent ?? entry.feePercent ?? 0.1)
        setResult(entry.result)
        setShowHistory(false)
    }

    const clearHistory = () => {
        setHistory([])
        localStorage.removeItem('crypto-calc-history')
    }

    const isValid = useMemo(() => {
        return (
            buyPrice > 0 &&
            sellPrice > 0 &&
            ((mode === "quantity" && quantity > 0) || (mode === "usd" && usdAmount > 0))
        )
    }, [mode, quantity, usdAmount, buyPrice, sellPrice])

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-4 pb-4">
            <footer className="text-sm text-neutral-500 my-6 text-center">
                Criado por <a href="https://www.linkedin.com/in/andersonbosa/" target="_blank" className="underline hover:text-white">Anderson Bosa</a>
            </footer>
            <Card className="w-full max-w-2xl p-6 bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Calculadora de Lucro/Prejuízo</h2>
                    {history.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="text-neutral-400 hover:text-white"
                                >
                                    <History className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Ver histórico de cálculos
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                <AnimatePresence>
                    {showHistory && history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold">Histórico</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearHistory}
                                    className="text-xs text-neutral-400 hover:text-white h-6"
                                >
                                    Limpar
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {history.map((entry, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadFromHistory(entry)}
                                        className="w-full text-left p-2 rounded hover:bg-neutral-700 transition-colors text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-300">
                                                {entry.mode === "quantity" || entry.mode === "crypto" || entry.mode === "btc" 
                                                    ? `${(entry.quantity ?? entry.cryptoAmount ?? entry.btcAmount ?? 0).toFixed(4)} unidades`
                                                    : formatCurrency(entry.usdAmount)}
                                            </span>
                                            <span className={entry.result.profitNet >= 0 ? "text-green-400" : "text-red-400"}>
                                                {formatCurrency(entry.result.profitNet)}
                                            </span>
                                        </div>
                                        <div className="text-neutral-500 text-xs mt-1">
                                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <RadioGroup
                    value={mode}
                    onValueChange={(value) => setMode(value as "quantity" | "usd")}
                    className="flex justify-center gap-6 mb-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quantity" id="r1" />
                        <Label htmlFor="r1">Quantidade do Ativo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="usd" id="r2" />
                        <Label htmlFor="r2">Valor em USD</Label>
                    </div>
                </RadioGroup>

                <div className="grid gap-4">
                    {mode === "quantity" ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label>Quantidade do Ativo</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="w-3 h-3 text-neutral-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Você já possui essa quantidade do ativo e quer simular uma venda.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                placeholder="Ex: 0.015 ou 100"
                                type="number"
                                value={quantity || ""}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.00001}
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label>Valor em USD</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="w-3 h-3 text-neutral-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Você comprará o ativo com esse valor e simulará a venda.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                placeholder="Ex: 1500"
                                type="number"
                                value={usdAmount || ""}
                                onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Preço de Compra (USD)</Label>
                            <Input
                                placeholder="Ex: 95000"
                                type="number"
                                value={buyPrice || ""}
                                onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                        <div>
                            <Label>Preço de Venda (USD)</Label>
                            <Input
                                placeholder="Ex: 99000"
                                type="number"
                                value={sellPrice || ""}
                                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <Button variant="ghost" size="sm" onClick={swapPrices} className="text-neutral-400 hover:text-white flex items-center gap-1">
                            <Repeat className="w-4 h-4" /> Inverter preços
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label>Taxa de Compra (%)</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="w-3 h-3 text-neutral-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Taxa cobrada pela corretora na compra do ativo.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                placeholder="Ex: 0.1"
                                type="number"
                                value={buyFeePercent || ""}
                                onChange={(e) => setBuyFeePercent(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Label>Taxa de Venda (%)</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="w-3 h-3 text-neutral-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Taxa cobrada pela corretora na venda do ativo.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                placeholder="Ex: 0.1"
                                type="number"
                                value={sellFeePercent || ""}
                                onChange={(e) => setSellFeePercent(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                                className="bg-neutral-800 border-neutral-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <Button
                        onClick={throttledCalculate}
                        disabled={!isValid}
                        className="w-full sm:w-auto"
                    >
                        Calcular Lucro
                    </Button>
                    <Button variant="secondary" onClick={shareUrl} className="flex items-center gap-2 w-full sm:w-auto">
                        <Share2 className="w-4 h-4" /> Compartilhar
                    </Button>
                </div>

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CardContent className="mt-8 space-y-4 text-sm bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                                {usdToBrl && (
                                    <div className="text-xs text-neutral-500 text-center mb-2">
                                        Cotação USD/BRL: {usdToBrl.toFixed(4)}
                                    </div>
                                )}
                                <div className="text-center text-2xl font-semibold mb-4">
                                    {result.profitNet >= 0 ? (
                                        <div className="text-green-400 flex flex-col items-center justify-center gap-1">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-6 h-6" />
                                                {formatCurrency(result.profitNet)} de lucro líquido
                                            </div>
                                            {usdToBrl && (
                                                <div className="text-lg text-neutral-400">
                                                    {formatCurrencyBRL(result.profitNet * usdToBrl)}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-red-400 flex flex-col items-center justify-center gap-1">
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="w-6 h-6" />
                                                {formatCurrency(result.profitNet)} de prejuízo
                                            </div>
                                            {usdToBrl && (
                                                <div className="text-lg text-neutral-400">
                                                    {formatCurrencyBRL(result.profitNet * usdToBrl)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 border-t pt-4 border-neutral-700">
                                    <span className="text-neutral-400">Quantidade negociada:</span>
                                    <span className="font-medium">{formatQuantity(result.quantity)} unidades</span>

                                    <span className="text-neutral-400">Valor de compra:</span>
                                    <div className="flex flex-col">
                                        <span>{formatCurrency(result.buyValue)}</span>
                                        {usdToBrl && (
                                            <span className="text-xs text-neutral-500">{formatCurrencyBRL(result.buyValue * usdToBrl)}</span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">Taxa de compra:</span>
                                    <div className="flex flex-col">
                                        <span className="text-red-400">-{formatCurrency(result.buyFee)}</span>
                                        {usdToBrl && (
                                            <span className="text-xs text-neutral-500 text-red-400">-{formatCurrencyBRL(result.buyFee * usdToBrl)}</span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">Total investido:</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{formatCurrency(result.buyTotal)}</span>
                                        {usdToBrl && (
                                            <span className="text-xs text-neutral-500 font-semibold">{formatCurrencyBRL(result.buyTotal * usdToBrl)}</span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">Valor de venda:</span>
                                    <div className="flex flex-col">
                                        <span>{formatCurrency(result.sellValue)}</span>
                                        {usdToBrl && (
                                            <span className="text-xs text-neutral-500">{formatCurrencyBRL(result.sellValue * usdToBrl)}</span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">Taxa de venda:</span>
                                    <div className="flex flex-col">
                                        <span className="text-red-400">-{formatCurrency(result.sellFee)}</span>
                                        {usdToBrl && (
                                            <span className="text-xs text-neutral-500 text-red-400">-{formatCurrencyBRL(result.sellFee * usdToBrl)}</span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">Receita líquida:</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{formatCurrency(result.sellNet)}</span>
                                        {usdToBrl && (
                                            <span className="text-xs text-neutral-500 font-semibold">{formatCurrencyBRL(result.sellNet * usdToBrl)}</span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">Lucro bruto:</span>
                                    <div className="flex flex-col">
                                        <span className={result.profitGross >= 0 ? "text-green-400" : "text-red-400"}>
                                            {formatCurrency(result.profitGross)}
                                        </span>
                                        {usdToBrl && (
                                            <span className={`text-xs text-neutral-500 ${result.profitGross >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                {formatCurrencyBRL(result.profitGross * usdToBrl)}
                                            </span>
                                        )}
                                    </div>

                                    <span className="text-neutral-400">ROI:</span>
                                    <span className={`font-semibold ${result.returnOnInvestment >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {formatPercent(result.returnOnInvestment)}
                                    </span>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    )
}
