import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AnimatePresence, motion } from "framer-motion";
import { Repeat, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

let throttleTimeout;

export default function BitcoinProfitCalculator() {
    const [mode, setMode] = useState("btc");
    const [btcAmount, setBtcAmount] = useState(0.1);
    const [usdAmount, setUsdAmount] = useState(1000);
    const [buyPrice, setBuyPrice] = useState(95000);
    const [sellPrice, setSellPrice] = useState(99000);
    const [feePercent, setFeePercent] = useState(0.1);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const shared = searchParams.get("share");
        if (shared) {
            try {
                const decoded = JSON.parse(atob(shared));
                setMode(decoded.mode);
                setBtcAmount(decoded.btcAmount);
                setUsdAmount(decoded.usdAmount);
                setBuyPrice(decoded.buyPrice);
                setSellPrice(decoded.sellPrice);
                setFeePercent(decoded.feePercent);
                calculateFromState(decoded);
            } catch (err) {
                console.error("Erro ao decodificar URL compartilhada", err);
            }
        }
    }, []);

    const calculateFromState = (state) => {
        const amountBtc =
            state.mode === "btc"
                ? state.btcAmount
                : (state.usdAmount / state.buyPrice) * (1 - state.feePercent * 0.01);

        const buyValue = amountBtc * state.buyPrice;
        const buyFee = buyValue * (state.feePercent * 0.01);
        const buyTotal = buyValue + buyFee;

        const sellValue = amountBtc * state.sellPrice;
        const sellFee = sellValue * (state.feePercent * 0.01);
        const sellNet = sellValue - sellFee;

        const profitGross = sellValue - buyValue;
        const profitNet = sellNet - buyTotal;
        const returnOnInvestment = (profitNet / buyTotal) * 100;

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
        });
    };

    const throttledCalculate = useCallback(() => {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            if (
                (mode === "btc" && btcAmount > 0) ||
                (mode === "usd" && usdAmount > 0)
            ) {
                calculateFromState({ mode, btcAmount, usdAmount, buyPrice, sellPrice, feePercent });
            }
        }, 400);
    }, [mode, btcAmount, usdAmount, buyPrice, sellPrice, feePercent]);

    useEffect(() => {
        throttledCalculate();
    }, [mode, btcAmount, usdAmount, buyPrice, sellPrice, feePercent, throttledCalculate]);

    const shareUrl = () => {
        const state = {
            mode,
            btcAmount,
            usdAmount,
            buyPrice,
            sellPrice,
            feePercent,
        };
        const encoded = btoa(JSON.stringify(state));
        const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
        navigator.clipboard.writeText(url).then(() => alert("Link copiado para área de transferência!"));
    };


    const swapPrices = () => {
        const temp = buyPrice;
        setBuyPrice(sellPrice);
        setSellPrice(temp);
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-4">
            <footer className="text-sm text-neutral-500 my-6 text-center">
                Criado por <a href="https://www.linkedin.com/in/andersonbosa/" target="_blank" className="underline hover:text-white">Anderson Bosa</a>
            </footer>
            <Card className="w-full max-w-2xl p-6 bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">Calculadora de Lucro Bitcoin</h2>

                <RadioGroup
                    value={mode}
                    onValueChange={setMode}
                    className="flex justify-center gap-6 mb-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="btc" id="r1" />
                        <Label htmlFor="r1">Valor Inicial em BTC</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="usd" id="r2" />
                        <Label htmlFor="r2">Valor Inicial em USD</Label>
                    </div>
                </RadioGroup>

                <div className="grid gap-4">
                    {mode === "btc" ? (
                        <div>
                            <Label>Valor Inicial em BTC</Label>
                            <Input
                                placeholder="Ex: 0.015"
                                type="number"
                                value={btcAmount}
                                onChange={(e) => setBtcAmount(parseFloat(e.target.value))}
                                min={0}
                                step={0.00001}
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                Você já possui essa quantidade de BTC e quer simular uma venda.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <Label>Valor Inicial em USD</Label>
                            <Input
                                placeholder="Ex: 1500"
                                type="number"
                                value={usdAmount}
                                onChange={(e) => setUsdAmount(parseFloat(e.target.value))}
                                min={0}
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                Você comprará BTC com esse valor e simulará a venda.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 items-end">
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
                    </div>

                    <div className="flex justify-center">
                        <Button variant="ghost" size="sm" onClick={swapPrices} className="text-neutral-400 hover:text-white flex items-center gap-1">
                            <Repeat className="w-4 h-4" /> Inverter preços
                        </Button>
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

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <Button
                        onClick={throttledCalculate}
                        disabled={
                            mode === "btc"
                                ? btcAmount <= 0
                                : usdAmount <= 0 || buyPrice <= 0 || sellPrice <= 0
                        }
                    >
                        Calcular Lucro
                    </Button>
                    <Button variant="secondary" onClick={shareUrl} className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Compartilhar
                    </Button>
                </div>

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
    );
}
