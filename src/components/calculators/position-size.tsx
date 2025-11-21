'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

let throttleTimeout: NodeJS.Timeout;

export default function PositionSize() {
    const [accountSize, setAccountSize] = useState(10000);
    const [riskPercent, setRiskPercent] = useState(1);
    const [entryPrice, setEntryPrice] = useState(100);
    const [stopLossPrice, setStopLossPrice] = useState(95);
    const [result, setResult] = useState<{
        riskAmount: number;
        priceRisk: number;
        positionSize: number;
        positionValue: number;
    } | null>(null);

    const calculatePositionSize = useCallback(() => {
        if (accountSize <= 0 || riskPercent <= 0 || entryPrice <= 0 || stopLossPrice <= 0) {
            setResult(null);
            return;
        }

        if (entryPrice === stopLossPrice) {
            setResult(null);
            return;
        }

        const riskAmount = accountSize * (riskPercent * 0.01);
        const priceRisk = Math.abs(entryPrice - stopLossPrice);
        const priceRiskPercent = (priceRisk / entryPrice) * 100;
        
        if (priceRiskPercent === 0) {
            setResult(null);
            return;
        }

        const positionSize = riskAmount / priceRisk;
        const positionValue = positionSize * entryPrice;

        setResult({
            riskAmount,
            priceRisk,
            positionSize,
            positionValue,
        });
    }, [accountSize, riskPercent, entryPrice, stopLossPrice]);

    const throttledCalculate = useCallback(() => {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            calculatePositionSize();
        }, 300);
    }, [calculatePositionSize]);

    useEffect(() => {
        throttledCalculate();
    }, [throttledCalculate]);

    return (
        <Card className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
            <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-center">Tamanho de Posição</h2>
                <p className="text-sm text-neutral-400 text-center mb-6">
                    Calcule o tamanho ideal da posição baseado no risco percentual da conta e distância do stop loss
                </p>

                <div className="space-y-6">
                    <div>
                        <Label>Tamanho da Conta (USD)</Label>
                        <Input
                            placeholder="Ex: 10000"
                            type="number"
                            value={accountSize}
                            onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                            min={0}
                            step={100}
                        />
                        <p className="text-xs text-neutral-400 mt-1">
                            Valor total disponível na conta para trading.
                        </p>
                    </div>

                    <div>
                        <Label>Risco por Trade (%)</Label>
                        <Input
                            placeholder="Ex: 1"
                            type="number"
                            value={riskPercent}
                            onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                            min={0}
                            max={100}
                            step={0.1}
                        />
                        <p className="text-xs text-neutral-400 mt-1">
                            Percentual do capital que você está disposto a arriscar neste trade.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Preço de Entrada (USD)</Label>
                            <Input
                                placeholder="Ex: 100"
                                type="number"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                            />
                        </div>
                        <div>
                            <Label>Preço de Stop Loss (USD)</Label>
                            <Input
                                placeholder="Ex: 95"
                                type="number"
                                value={stopLossPrice}
                                onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
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
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-green-400 mb-2">
                                        {result.positionSize.toFixed(4)} unidades
                                    </div>
                                    <div className="text-lg text-neutral-300">
                                        ${result.positionValue.toFixed(2)} em valor
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-4">
                                    <span className="text-neutral-400">Valor em Risco:</span>
                                    <span className="text-red-400">${result.riskAmount.toFixed(2)}</span>
                                    <span className="text-neutral-400">Risco por Unidade:</span>
                                    <span>${result.priceRisk.toFixed(2)}</span>
                                    <span className="text-neutral-400">Tamanho da Posição:</span>
                                    <span className="text-green-400">{result.positionSize.toFixed(4)}</span>
                                    <span className="text-neutral-400">Valor Total da Posição:</span>
                                    <span className="text-green-400">${result.positionValue.toFixed(2)}</span>
                                </div>

                                <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg">
                                    <p className="text-xs text-neutral-400">
                                        <strong className="text-white">Como funciona:</strong> Com ${accountSize.toFixed(2)} na conta e 
                                        arriscando {riskPercent}% (${result.riskAmount.toFixed(2)}), você pode comprar{" "}
                                        {result.positionSize.toFixed(4)} unidades. Se o stop loss for acionado, você perderá 
                                        exatamente ${result.riskAmount.toFixed(2)}.
                                    </p>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

