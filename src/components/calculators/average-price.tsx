'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Execution {
    id: string;
    price: number;
    quantity: number;
}

let throttleTimeout: NodeJS.Timeout;

export default function AveragePrice() {
    const [executions, setExecutions] = useState<Execution[]>([
        { id: '1', price: 100, quantity: 10 },
        { id: '2', price: 105, quantity: 5 },
    ]);
    const [result, setResult] = useState<{
        totalQuantity: number;
        totalValue: number;
        averagePrice: number;
    } | null>(null);

    const calculateAveragePrice = useCallback(() => {
        if (executions.length === 0) {
            setResult(null);
            return;
        }

        let totalQuantity = 0;
        let totalValue = 0;

        executions.forEach(exec => {
            if (exec.price > 0 && exec.quantity > 0) {
                totalQuantity += exec.quantity;
                totalValue += exec.price * exec.quantity;
            }
        });

        if (totalQuantity === 0) {
            setResult(null);
            return;
        }

        const averagePrice = totalValue / totalQuantity;

        setResult({
            totalQuantity,
            totalValue,
            averagePrice,
        });
    }, [executions]);

    const throttledCalculate = useCallback(() => {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            calculateAveragePrice();
        }, 300);
    }, [calculateAveragePrice]);

    useEffect(() => {
        throttledCalculate();
    }, [throttledCalculate]);

    const addExecution = () => {
        const newId = Date.now().toString();
        setExecutions([...executions, { id: newId, price: 0, quantity: 0 }]);
    };

    const removeExecution = (id: string) => {
        if (executions.length > 1) {
            setExecutions(executions.filter(exec => exec.id !== id));
        }
    };

    const updateExecution = (id: string, field: 'price' | 'quantity', value: number) => {
        setExecutions(executions.map(exec =>
            exec.id === id ? { ...exec, [field]: value } : exec
        ));
    };

    return (
        <Card className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
            <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-center">Preço Médio (DCA)</h2>
                <p className="text-sm text-neutral-400 text-center mb-6">
                    Calcule o preço médio ponderado quando você adiciona posições em diferentes preços
                </p>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="text-sm text-neutral-400">Execuções</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addExecution}
                            className="flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Adicionar Execução
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {executions.map((exec, index) => (
                            <motion.div
                                key={exec.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end"
                            >
                                <div>
                                    <Label className="text-xs text-neutral-400">Preço #{index + 1}</Label>
                                    <Input
                                        placeholder="Ex: 100"
                                        type="number"
                                        value={exec.price || ''}
                                        onChange={(e) => updateExecution(exec.id, 'price', parseFloat(e.target.value) || 0)}
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-neutral-400">Quantidade #{index + 1}</Label>
                                    <Input
                                        placeholder="Ex: 10"
                                        type="number"
                                        value={exec.quantity || ''}
                                        onChange={(e) => updateExecution(exec.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        min={0}
                                        step={0.00001}
                                    />
                                </div>
                                <div>
                                    {executions.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeExecution(exec.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-xs text-neutral-400 mt-4">
                        Adicione múltiplas execuções para calcular o preço médio ponderado da sua posição.
                    </p>
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
                                    <div className="text-3xl font-bold text-green-400 mb-2">
                                        ${result.averagePrice.toFixed(2)}
                                    </div>
                                    <div className="text-lg text-neutral-300">
                                        Preço Médio Ponderado
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-4">
                                    <span className="text-neutral-400">Quantidade Total:</span>
                                    <span className="text-green-400">{result.totalQuantity.toFixed(4)}</span>
                                    <span className="text-neutral-400">Valor Total:</span>
                                    <span className="text-green-400">${result.totalValue.toFixed(2)}</span>
                                    <span className="text-neutral-400">Preço Médio:</span>
                                    <span className="text-green-400 font-semibold">${result.averagePrice.toFixed(2)}</span>
                                </div>

                                <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg">
                                    <div className="text-xs text-neutral-400 mb-2">
                                        <strong className="text-white">Detalhamento:</strong>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        {executions.map((exec, index) => {
                                            if (exec.price > 0 && exec.quantity > 0) {
                                                const value = exec.price * exec.quantity;
                                                const percent = (value / result.totalValue) * 100;
                                                return (
                                                    <div key={exec.id} className="flex justify-between">
                                                        <span className="text-neutral-400">
                                                            Execução #{index + 1}: {exec.quantity.toFixed(4)} @ ${exec.price.toFixed(2)}
                                                        </span>
                                                        <span className="text-neutral-300">
                                                            {percent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

