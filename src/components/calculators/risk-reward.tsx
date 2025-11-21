'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

let throttleTimeout: NodeJS.Timeout;

export default function RiskReward() {
    const [entryPrice, setEntryPrice] = useState(100);
    const [stopLossPrice, setStopLossPrice] = useState(95);
    const [targetPrice, setTargetPrice] = useState(110);
    const [result, setResult] = useState<{
        risk: number;
        reward: number;
        ratio: number;
        riskPercent: number;
        rewardPercent: number;
    } | null>(null);

    const calculateRiskReward = useCallback(() => {
        if (entryPrice <= 0 || stopLossPrice <= 0 || targetPrice <= 0) {
            setResult(null);
            return;
        }

        const risk = Math.abs(entryPrice - stopLossPrice);
        const reward = Math.abs(targetPrice - entryPrice);

        if (risk === 0) {
            setResult(null);
            return;
        }

        const ratio = reward / risk;
        const riskPercent = (risk / entryPrice) * 100;
        const rewardPercent = (reward / entryPrice) * 100;

        setResult({
            risk,
            reward,
            ratio,
            riskPercent,
            rewardPercent,
        });
    }, [entryPrice, stopLossPrice, targetPrice]);

    const throttledCalculate = useCallback(() => {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            calculateRiskReward();
        }, 300);
    }, [calculateRiskReward]);

    useEffect(() => {
        throttledCalculate();
    }, [throttledCalculate]);

    const getRatioColor = (ratio: number) => {
        if (ratio >= 2) return "text-green-400";
        if (ratio >= 1) return "text-yellow-400";
        return "text-red-400";
    };

    const getRatioIcon = (ratio: number) => {
        if (ratio >= 2) return <CheckCircle2 className="w-5 h-5" />;
        if (ratio >= 1) return <AlertCircle className="w-5 h-5" />;
        return <AlertCircle className="w-5 h-5" />;
    };

    const getRatioMessage = (ratio: number) => {
        if (ratio >= 3) return "Excelente! Risco/Reward muito favorável.";
        if (ratio >= 2) return "Bom! Risco/Reward favorável.";
        if (ratio >= 1) return "Atenção! Risco/Reward apenas equilibrado.";
        return "Cuidado! Risco maior que o potencial retorno.";
    };

    return (
        <Card className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
            <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-center">Risco/Retorno</h2>
                <p className="text-sm text-neutral-400 text-center mb-6">
                    Analise a relação entre risco e potencial retorno de um trade antes de entrar na posição
                </p>

                <div className="space-y-6">
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <Label>Preço de Target (USD)</Label>
                            <Input
                                placeholder="Ex: 110"
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
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
                                    <div className={`text-4xl font-bold mb-2 flex items-center justify-center gap-2 ${getRatioColor(result.ratio)}`}>
                                        {getRatioIcon(result.ratio)}
                                        {result.ratio.toFixed(2)}:1
                                    </div>
                                    <div className="text-lg text-neutral-300 mb-2">
                                        Risco/Reward Ratio
                                    </div>
                                    <div className={`text-sm ${getRatioColor(result.ratio)}`}>
                                        {getRatioMessage(result.ratio)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <div className="text-xs text-neutral-400 mb-1">Risco</div>
                                        <div className="text-xl font-semibold text-red-400">
                                            ${result.risk.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {result.riskPercent.toFixed(2)}% do preço de entrada
                                        </div>
                                    </div>
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="text-xs text-neutral-400 mb-1">Reward</div>
                                        <div className="text-xl font-semibold text-green-400">
                                            ${result.reward.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {result.rewardPercent.toFixed(2)}% do preço de entrada
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-4">
                                    <span className="text-neutral-400">Preço de Entrada:</span>
                                    <span>${entryPrice.toFixed(2)}</span>
                                    <span className="text-neutral-400">Stop Loss:</span>
                                    <span className="text-red-400">${stopLossPrice.toFixed(2)}</span>
                                    <span className="text-neutral-400">Target:</span>
                                    <span className="text-green-400">${targetPrice.toFixed(2)}</span>
                                    <span className="text-neutral-400">Distância do Stop:</span>
                                    <span className="text-red-400">-{result.riskPercent.toFixed(2)}%</span>
                                    <span className="text-neutral-400">Distância do Target:</span>
                                    <span className="text-green-400">+{result.rewardPercent.toFixed(2)}%</span>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

