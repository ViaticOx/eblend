'use client';

import React, { useMemo, useState } from 'react';

type Preset = 'yourCase' | 'e0' | 'e10' | 'e30' | 'e50';
type BlendInputs = { Vg: number; Eg: number; Ea: number; Et: number };
type BlendResult =
    | { ok: false; errors: string[] }
    | { ok: true; Ve: number; Vt: number; Efinal: number; waterL: number; note: string };

function parseNum(v: unknown): number {
    const n = Number(String(v).trim().replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
}

function fmt(n: number, digits: number = 2): string {
    if (!Number.isFinite(n)) return '–';
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    }).format(n);
}

function clamp(n: number, a: number, b: number): number {
    return Math.min(b, Math.max(a, n));
}

type WithChildren = { children?: React.ReactNode };

type CardProps = WithChildren & { className?: string };
function Card({ className = '', children }: CardProps) {
    return (
        <div
            className={`rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${className}`}
        >
            {children}
        </div>
    );
}

type ButtonVariant = 'primary' | 'ghost' | 'soft';
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    glow?: boolean;
};
function Button({ variant = 'soft', glow = false, className = '', children, ...props }: ButtonProps) {
    const base =
        'inline-flex items-center justify-center rounded-2xl px-3.5 py-2.5 text-sm font-semibold tracking-tight transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed';
    const styles: Record<ButtonVariant, string> = {
        primary:
            'text-black bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-300 shadow-lg shadow-fuchsia-500/10 hover:brightness-110',
        soft: 'text-white bg-white/10 border border-white/10 hover:bg-white/15 hover:border-white/20',
        ghost: 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10',
    };
    const glowRing = glow ? 'ring-1 ring-white/15 hover:ring-white/25' : '';
    return (
        <button className={`${base} ${styles[variant]} ${glowRing} ${className}`} {...props}>
            {children}
        </button>
    );
}

function Stat({
                  label,
                  value,
                  sub,
                  accent = 'from-cyan-400/35 via-fuchsia-400/25 to-lime-400/25',
              }: {
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-50`} />
            <div className="relative">
                <div className="text-xs font-semibold tracking-wide text-white/70">{label}</div>
                <div className="mt-1 text-2xl font-black tracking-tight text-white">{value}</div>
                {sub ? <div className="mt-1 text-xs text-white/60">{sub}</div> : null}
            </div>
        </div>
    );
}

function BrandTag() {
    return (
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-lime-300 to-cyan-300" />
            <span className="text-sm font-black tracking-[0.18em] text-white/90">
        CREATED BY{' '}
                <span className="bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
          EXTREME RACING
        </span>
      </span>
        </div>
    );
}

function InputField(props: {
    label: string;
    hint: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    unit?: string;
}) {
    const { label, hint, value, onChange, placeholder, unit } = props;
    return (
        <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
                <label className="text-sm font-semibold tracking-tight text-white">{label}</label>
                {unit ? <span className="text-xs font-semibold text-white/60">{unit}</span> : null}
            </div>
            <div className="relative">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-50" />
                <input
                    className="relative w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[15px] font-medium tracking-tight text-white outline-none placeholder:text-white/25 focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    inputMode="decimal"
                    placeholder={placeholder}
                />
            </div>
            <div className="text-xs text-white/60">{hint}</div>
        </div>
    );
}

export default function Page() {
    const [gasLiters, setGasLiters] = useState<string>('13');
    const [gasE, setGasE] = useState<string>('6');
    const [ethanolStrength, setEthanolStrength] = useState<string>('96');
    const [targetE, setTargetE] = useState<string>('40');

    const inputs = useMemo<BlendInputs>(() => {
        const Vg = parseNum(gasLiters);
        const Eg = parseNum(gasE) / 100;
        const Ea = parseNum(ethanolStrength) / 100;
        const Et = parseNum(targetE) / 100;
        return { Vg, Eg, Ea, Et };
    }, [gasLiters, gasE, ethanolStrength, targetE]);

    const result = useMemo<BlendResult>(() => {
        const { Vg, Eg, Ea, Et } = inputs;
        const errors: string[] = [];

        if (!(Vg > 0)) errors.push('Inserisci litri benzina > 0.');
        if (!Number.isFinite(Eg) || Eg < 0 || Eg > 1) errors.push('E% benzina deve essere tra 0 e 100.');
        if (!Number.isFinite(Ea) || Ea <= 0 || Ea > 1) errors.push('% bioetanolo deve essere tra 0 e 100 (e > 0).');
        if (!Number.isFinite(Et) || Et < 0 || Et > 1) errors.push('Target E% deve essere tra 0 e 100.');

        if (errors.length) return { ok: false, errors };

        if (Math.abs(Ea - Et) < 1e-12) {
            if (Math.abs(Eg - Et) < 1e-12) return { ok: true, Ve: 0, Vt: Vg, Efinal: Et, waterL: 0, note: 'Sei già al target.' };
            return { ok: false, errors: ['Impossibile: la % del bioetanolo è uguale al target.'] };
        }

        const VeRaw = (Vg * (Et - Eg)) / (Ea - Et);

        if (VeRaw < -1e-9) {
            return {
                ok: false,
                errors: ['Risultato negativo: la miscela iniziale è già sopra il target (non puoi “togliere” etanolo aggiungendone).'],
            };
        }

        if (Et > Ea + 1e-12 && Eg < Et - 1e-12) {
            return { ok: false, errors: ['Impossibile: il target è più alto della % del bioetanolo.'] };
        }

        const Ve = clamp(VeRaw, 0, 1e9);
        const Vt = Vg + Ve;
        const Efinal = (Vg * Eg + Ve * Ea) / Vt;
        const waterL = Ve * (1 - Ea);

        const note = Math.abs(Efinal - Et) < 5e-4 ? 'Miscela centrata.' : 'Nota: arrotondamenti possono dare scostamenti minimi.';
        return { ok: true, Ve, Vt, Efinal, waterL, note };
    }, [inputs]);

    const quickPreset = (preset: Preset) => {
        if (preset === 'yourCase') {
            setGasLiters('13');
            setGasE('6');
            setEthanolStrength('96');
            setTargetE('40');
            return;
        }
        if (preset === 'e0') setGasE('0');
        if (preset === 'e10') setGasE('10');
        if (preset === 'e30') setTargetE('30');
        if (preset === 'e50') setTargetE('50');
    };

    return (
        <div className="min-h-screen bg-[#070812] text-white antialiased">
            {/* Background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-fuchsia-500/25 to-cyan-500/10 blur-3xl" />
                <div className="absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-lime-400/20 to-cyan-500/10 blur-3xl" />
                <div className="absolute left-1/2 top-[55%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-lime-500/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:18px_18px] opacity-30" />
            </div>

            <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-12">
                {/* Header */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-4">
                        <BrandTag />

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                                Calcolatore Miscela{' '}
                                <span className="bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                  E%
                </span>
                            </h1>
                            <p className="max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
                                Inserisci volume iniziale, E% benzina, grado del bioetanolo e target. Calcolo immediato dei litri da aggiungere e stima acqua/impurezze.
                            </p>
                        </div>
                    </div>

                    {/* Buttons: no "Preset/Target" words */}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="primary" glow onClick={() => quickPreset('yourCase')}>
                            13L E6 → E40 (96)
                        </Button>
                        <Button variant="soft" onClick={() => quickPreset('e10')}>
                            E10
                        </Button>
                        <Button variant="soft" onClick={() => quickPreset('e0')}>
                            E0
                        </Button>
                        <Button variant="ghost" onClick={() => quickPreset('e30')}>
                            E30
                        </Button>
                        <Button variant="ghost" onClick={() => quickPreset('e50')}>
                            E50
                        </Button>
                    </div>
                </div>

                {/* Main grid */}
                <div className="mt-8 grid gap-6 lg:grid-cols-12">
                    {/* Inputs */}
                    <Card className="lg:col-span-7">
                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-sm font-black tracking-wide text-white/90">INPUT</div>
                                <div className="text-xs font-semibold text-white/50">Volumi additivi (approx.)</div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <InputField
                                    label="Litri benzina iniziali"
                                    hint="Volume nel serbatoio o nel contenitore."
                                    value={gasLiters}
                                    onChange={setGasLiters}
                                    placeholder="es. 13"
                                    unit="L"
                                />
                                <InputField
                                    label="E% benzina (già presente)"
                                    hint="E6 = 6% etanolo in volume."
                                    value={gasE}
                                    onChange={setGasE}
                                    placeholder="es. 6"
                                    unit="%"
                                />
                                <InputField
                                    label="Bioetanolo (% in volume)"
                                    hint="Se è 96%, il restante 4% è acqua/impurezze."
                                    value={ethanolStrength}
                                    onChange={setEthanolStrength}
                                    placeholder="es. 96"
                                    unit="%"
                                />
                                <InputField
                                    label="Target E%"
                                    hint="E40 = 40% etanolo in volume nella miscela finale."
                                    value={targetE}
                                    onChange={setTargetE}
                                    placeholder="es. 40"
                                    unit="%"
                                />
                            </div>

                            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                                <div className="text-xs font-semibold text-white/60">
                                    Formula: (Vg·Eg + Ve·Ea) / (Vg + Ve) = Et → Ve = Vg·(Et−Eg)/(Ea−Et)
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Output */}
                    <Card className="lg:col-span-5">
                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-black tracking-wide text-white/90">RISULTATO</div>
                                <div className="text-xs font-semibold text-white/50">Realtime</div>
                            </div>

                            {!result.ok ? (
                                <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
                                    <div className="text-sm font-bold text-red-200">Controlla questi valori</div>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100/90">
                                        {result.errors.map((e, idx) => (
                                            <li key={idx}>{e}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-4 grid gap-3">
                                        <Stat label="Bioetanolo da aggiungere" value={`${fmt(result.Ve, 2)} L`} sub="Litri di E% indicato da versare." />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Stat label="Totale miscela" value={`${fmt(result.Vt, 2)} L`} accent="from-white/10 via-cyan-400/20 to-white/10" />
                                            <Stat label="E% finale" value={`${fmt(result.Efinal * 100, 2)}%`} accent="from-lime-400/20 via-fuchsia-400/15 to-cyan-400/20" />
                                        </div>
                                        <Stat
                                            label="Acqua/impurezze introdotte (stima)"
                                            value={`${fmt(result.waterL, 2)} L`}
                                            sub="Assumendo resto = acqua/impurezze."
                                            accent="from-cyan-400/20 via-white/10 to-fuchsia-400/20"
                                        />
                                    </div>

                                    <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                                        <div className="font-semibold text-white">Nota</div>
                                        <div className="mt-1">{result.note}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
