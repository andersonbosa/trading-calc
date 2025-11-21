'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AnimatePresence, motion } from "framer-motion";
import { Repeat, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

let throttleTimeout: NodeJS.Timeout;

export default function ProfitLoss() {
    const [positionType, setPositionType] = useState<"long" | "short">("long");
    const [mode, setMode] = useState<"quantity" | "usd">("quantity");
    const [quantity, setQuantity] = useState(1);
    const [usdAmount, setUsdAmount] = useState(1000);
    const [buyPrice, setBuyPrice] = useState(100);
    const [sellPrice, setSellPrice] = useState(105);
    const [buyFeePercent, setBuyFeePercent] = useState(0.1);
    const [sellFeePercent, setSellFeePercent] = useState(0.1);
    const [result, setResult] = useState<{
        quantity: number;
        profitGross: number;
        profitNet: number;
        returnOnInvestment: number;
        buyTotal: number;
        sellNet: number;
        buyFee: number;
        sellFee: number;
    } | null>(null);

    const calculateProfitLoss = useCallback(() => {
        if (buyPrice <= 0 || sellPrice <= 0) {
            setResult(null);
            return;
        }

        let actualQuantity: number;
        if (mode === "quantity") {
            if (quantity <= 0) {
                setResult(null);
                return;
            }
            actualQuantity = quantity;
        } else {
            if (usdAmount <= 0) {
                setResult(null);
                return;
            }
            actualQuantity = (usdAmount / buyPrice) * (1 - buyFeePercent * 0.01);
        }

        const buyValue = actualQuantity * buyPrice;
        const buyFee = buyValue * (buyFeePercent * 0.01);
        const buyTotal = buyValue + buyFee;

        const sellValue = actualQuantity * sellPrice;
        const sellFee = sellValue * (sellFeePercent * 0.01);
        const sellNet = sellValue - sellFee;

        let profitGross: number;
        let profitNet: number;

        if (positionType === "long") {
            profitGross = sellValue - buyValue;
            profitNet = sellNet - buyTotal;
        } else {
            profitGross = buyValue - sellValue;
            profitNet = buyTotal - sellNet;
        }

        const returnOnInvestment = (profitNet / buyTotal) * 100;

        setResult({
            quantity: actualQuantity,
            profitGross,
            profitNet,
            returnOnInvestment,
            buyTotal,
            sellNet,
            buyFee,
            sellFee,
        });
    }, [positionType, mode, quantity, usdAmount, buyPrice, sellPrice, buyFeePercent, sellFeePercent]);

    const throttledCalculate = useCallback(() => {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            calculateProfitLoss();
        }, 300);
    }, [calculateProfitLoss]);

    useEffect(() => {
        throttledCalculate();
    }, [throttledCalculate]);

    const swapPrices = () => {
        const temp = buyPrice;
        setBuyPrice(sellPrice);
        setSellPrice(temp);
    };

    return (
        <Card className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
            <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-center">Lucro/Prejuízo</h2>
                <p className="text-sm text-neutral-400 text-center mb-6">
                    Calcule o lucro ou prejuízo líquido de uma operação considerando taxas e tipo de posição
                </p>

                <div className="space-y-6">
                    <div>
                        <Label className="mb-2 block">Tipo de Posição</Label>
                        <RadioGroup
                            value={positionType}
                            onValueChange={(value) => setPositionType(value as "long" | "short")}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="long" id="long" />
                                <Label htmlFor="long">Long (Compra/Venda)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="short" id="short" />
                                <Label htmlFor="short">Short (Venda/Compra)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div>
                        <Label className="mb-2 block">Modo de Entrada</Label>
                        <RadioGroup
                            value={mode}
                            onValueChange={(value) => setMode(value as "quantity" | "usd")}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="quantity" id="qty" />
                                <Label htmlFor="qty">Quantidade</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="usd" id="usd" />
                                <Label htmlFor="usd">Valor Inicial (USD)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {mode === "quantity" ? (
                        <div>
                            <Label>Quantidade</Label>
                            <Input
                                placeholder="Ex: 1"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.00001}
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                Você já possui essa quantidade e quer simular uma venda.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <Label>Valor Inicial (USD)</Label>
                            <Input
                                placeholder="Ex: 1000"
                                type="number"
                                value={usdAmount}
                                onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={1}
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                Você comprará com esse valor e simulará a venda.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                            <Label>{positionType === "long" ? "Preço de Compra" : "Preço de Venda"} (USD)</Label>
                            <Input
                                placeholder="Ex: 100"
                                type="number"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                            />
                        </div>
                        <div>
                            <Label>{positionType === "long" ? "Preço de Venda" : "Preço de Compra"} (USD)</Label>
                            <Input
                                placeholder="Ex: 105"
                                type="number"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
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
                            <Label>Taxa de Compra (%)</Label>
                            <Input
                                placeholder="Ex: 0.1"
                                type="number"
                                value={buyFeePercent}
                                onChange={(e) => setBuyFeePercent(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                            />
                        </div>
                        <div>
                            <Label>Taxa de Venda (%)</Label>
                            <Input
                                placeholder="Ex: 0.1"
                                type="number"
                                value={sellFeePercent}
                                onChange={(e) => setSellFeePercent(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                            />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="mt-8"
                        >
                            <CardContent className="space-y-4 text-sm border-t border-neutral-800 pt-6">
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

                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-neutral-400">Quantidade Negociada:</span>
                                    <span>{result.quantity.toFixed(4)}</span>
                                    <span className="text-neutral-400">Lucro/Prejuízo Bruto:</span>
                                    <span className={result.profitGross >= 0 ? "text-green-400" : "text-red-400"}>
                                        ${result.profitGross.toFixed(2)}
                                    </span>
                                    <span className="text-neutral-400">Total Investido:</span>
                                    <span>${result.buyTotal.toFixed(2)}</span>
                                    <span className="text-neutral-400">Receita Líquida:</span>
                                    <span>${result.sellNet.toFixed(2)}</span>
                                    <span className="text-neutral-400">Taxa Compra:</span>
                                    <span>${result.buyFee.toFixed(2)}</span>
                                    <span className="text-neutral-400">Taxa Venda:</span>
                                    <span>${result.sellFee.toFixed(2)}</span>
                                    <span className="text-neutral-400">ROI:</span>
                                    <span className={result.returnOnInvestment >= 0 ? "text-green-400" : "text-red-400"}>
                                        {result.returnOnInvestment.toFixed(2)}%
                                    </span>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}


