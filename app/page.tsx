'use client';

import React, { useMemo, useState } from "react";

// Minimal UI wrappers (no external UI library needed)

type WithChildren = { children?: React.ReactNode };

type CardProps = WithChildren & { className?: string };
function Card({ className = "", children }: CardProps) {
    return <div className={`border rounded-2xl shadow-sm bg-white ${className}`}>{children}</div>;
}

type CardContentProps = WithChildren & { className?: string };
function CardContent({ className = "", children }: CardContentProps) {
    return <div className={className}>{children}</div>;
}

type ButtonVariant = "default" | "secondary" | "outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    className?: string;
};

function Button({ variant = "default", className = "", children, ...props }: ButtonProps) {
    const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border";
    const variants: Record<ButtonVariant, string> = {
        default: "bg-black text-white border-black",
        secondary: "bg-gray-100 text-black border-gray-200",
        outline: "bg-white text-black border-gray-300",
    };
    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}


function clamp(n: number, a: number, b: number) {
    return Math.min(b, Math.max(a, n));
}

function fmt(n: number, digits: number = 2) {
    if (!Number.isFinite(n)) return "–";
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    }).format(n);
}

function parseNum(v: unknown) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
}

type BlendResult =
    | { ok: false; errors: string[] }
    | { ok: true; Ve: number; Vt: number; Efinal: number; waterL: number; note: string };

export default function App() {
    const [gasLiters, setGasLiters] = useState("13");
    const [gasE, setGasE] = useState("6");
    const [ethanolStrength, setEthanolStrength] = useState("96");
    const [targetE, setTargetE] = useState("40");

    const inputs = useMemo(() => {
        const Vg = parseNum(gasLiters);
        const Eg = parseNum(gasE) / 100;
        const Ea = parseNum(ethanolStrength) / 100;
        const Et = parseNum(targetE) / 100;
        return { Vg, Eg, Ea, Et };
    }, [gasLiters, gasE, ethanolStrength, targetE]);

    const result = useMemo<BlendResult>(() => {
        const { Vg, Eg, Ea, Et } = inputs;

        const errors = [];
        if (!(Vg > 0)) errors.push("Inserisci litri benzina > 0.");
        if (!Number.isFinite(Eg) || Eg < 0 || Eg > 1) errors.push("E% benzina deve essere tra 0 e 100.");
        if (!Number.isFinite(Ea) || Ea <= 0 || Ea > 1) errors.push("% bioetanolo deve essere tra 0 e 100 (e > 0).\n");
        if (!Number.isFinite(Et) || Et < 0 || Et > 1) errors.push("Target E% deve essere tra 0 e 100.");

        if (errors.length) {
            return { ok: false, errors };
        }

        // If the additive ethanol strength is <= target, you cannot reach target by adding it to a lower-E base.
        if (Ea === Et) {
            if (Math.abs(Eg - Et) < 1e-12) {
                return {
                    ok: true,
                    Ve: 0,
                    Vt: Vg,
                    Efinal: Et,
                    waterL: 0,
                    note: "Sei già al target. Aggiungere questo bioetanolo non cambia l'E%.",
                };
            }
            return {
                ok: false,
                errors: ["Impossibile: la % del bioetanolo è uguale al target. Non puoi spostare la miscela verso il target."],
            };
        }

        // Solve for liters of ethanol source to add:
        // (Vg*Eg + Ve*Ea) / (Vg + Ve) = Et
        // Ve = Vg*(Et - Eg) / (Ea - Et)
        const Ve = (Vg * (Et - Eg)) / (Ea - Et);

        // If Ve is negative, it means the base is already above target, or the additive direction is wrong.
        if (Ve < -1e-9) {
            return {
                ok: false,
                errors: [
                    "Risultato negativo: la benzina di partenza è già sopra il target (o la % del bioetanolo non consente di arrivarci aggiungendolo).",
                ],
            };
        }

        const VeClamped = clamp(Ve, 0, 1e9);
        const Vt = Vg + VeClamped;
        const Efinal = (Vg * Eg + VeClamped * Ea) / Vt;

        // Water introduced by ethanol source (assuming the remainder is water)
        const waterL = VeClamped * (1 - Ea);

        // Sanity: if target is higher than additive strength, unreachable when Eg < target
        if (Et > Ea + 1e-12 && Eg < Et - 1e-12) {
            return {
                ok: false,
                errors: ["Impossibile: il target è più alto della % del bioetanolo. Per arrivarci serve un etanolo più puro (o una base già più ricca)."],
            };
        }

        return {
            ok: true,
            Ve: VeClamped,
            Vt,
            Efinal,
            waterL,
            note: Math.abs(Efinal - Et) < 5e-4 ? "Miscela centrata." : "Nota: arrotondamenti possono dare scostamenti minimi.",
        };
    }, [inputs]);

    const quickPreset = (preset) => {
        if (preset === "yourCase") {
            setGasLiters("13");
            setGasE("6");
            setEthanolStrength("96");
            setTargetE("40");
        }
        if (preset === "e0") {
            setGasE("0");
        }
        if (preset === "e10") {
            setGasE("10");
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8 text-black">
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="text-2xl font-semibold text-black">Calcolatore miscela E%</div>
                        <div className="text-sm text-gray-600">
                            Calcola quanti litri di bioetanolo aggiungere per arrivare al target (es. E40).
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => quickPreset("yourCase")}>Preset 13L E6 → E40 con 96%</Button>
                        <Button variant="outline" onClick={() => quickPreset("e10")}>Benzina E10</Button>
                        <Button variant="outline" onClick={() => quickPreset("e0")}>Benzina E0</Button>
                    </div>
                </div>

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 md:p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Litri benzina iniziali</label>
                                <input
                                    className="w-full rounded-xl border px-3 py-2"
                                    value={gasLiters}
                                    onChange={(e) => setGasLiters(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="es. 13"
                                />
                                <div className="text-xs text-gray-600">Volume iniziale nel serbatoio o nel contenitore.</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">E% benzina (già presente)</label>
                                <input
                                    className="w-full rounded-xl border px-3 py-2"
                                    value={gasE}
                                    onChange={(e) => setGasE(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="es. 6"
                                />
                                <div className="text-xs text-gray-600">E6 = 6% etanolo in volume.</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bioetanolo (% in volume)</label>
                                <input
                                    className="w-full rounded-xl border px-3 py-2"
                                    value={ethanolStrength}
                                    onChange={(e) => setEthanolStrength(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="es. 96"
                                />
                                <div className="text-xs text-gray-600">Se è “96%”, il restante 4% è acqua/impurezze.</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target E%</label>
                                <input
                                    className="w-full rounded-xl border px-3 py-2"
                                    value={targetE}
                                    onChange={(e) => setTargetE(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="es. 40"
                                />
                                <div className="text-xs text-gray-600">E40 = 40% etanolo in volume nella miscela finale.</div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border p-4">
                            <div className="text-sm font-semibold">Risultato</div>

                            {!result.ok ? (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                                    {result.errors.map((e, idx) => (
                                        <li key={idx}>{e}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border p-3">
                                        <div className="text-xs text-gray-600">Bioetanolo da aggiungere</div>
                                        <div className="text-xl font-semibold">{fmt(result.Ve, 2)} L</div>
                                    </div>
                                    <div className="rounded-2xl border p-3">
                                        <div className="text-xs text-gray-600">Totale miscela</div>
                                        <div className="text-xl font-semibold">{fmt(result.Vt, 2)} L</div>
                                    </div>
                                    <div className="rounded-2xl border p-3">
                                        <div className="text-xs text-gray-600">E% finale (calcolata)</div>
                                        <div className="text-xl font-semibold">{fmt(result.Efinal * 100, 2)}%</div>
                                    </div>
                                    <div className="rounded-2xl border p-3">
                                        <div className="text-xs text-gray-600">Acqua introdotta (stima)</div>
                                        <div className="text-xl font-semibold">{fmt(result.waterL, 2)} L</div>
                                    </div>
                                    <div className="md:col-span-2 text-sm text-gray-600">{result.note}</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 text-xs text-gray-600">
                            Formula usata: (Vg·Eg + Ve·Ea) / (Vg + Ve) = Et  →  Ve = Vg·(Et−Eg)/(Ea−Et)
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 md:p-6">
                        <div className="text-sm font-semibold">Note</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                            <li>Assume volumi additivi (buona approssimazione per calcoli pratici).</li>
                            <li>Se la benzina di partenza è già sopra il target, il calcolo richiede “togliere” etanolo (non possibile aggiungendone).</li>
                            <li>Se vuoi aggiungere anche benzina dopo (per arrivare a un volume preciso), posso aggiungere quella modalità nel codice.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
