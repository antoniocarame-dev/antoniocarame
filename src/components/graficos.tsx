"use client";
import {
  CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Area, AreaChart, Label, Bar, Cell, ComposedChart, Legend,
} from "recharts";

const eje = { fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" };
const tip = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
};

export function RadarAreas({ datos }: { datos: { area: string; actual: number; inicial?: number }[] }) {
  if (datos.length < 3) return <p className="text-sm text-muted-foreground">Hacen falta al menos 3 áreas auditadas para dibujar el radar.</p>;
  const comparar = datos.some((d) => d.inicial != null && d.inicial !== d.actual);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={datos} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="area" tick={{ ...eje, fill: "var(--foreground)" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {comparar && <Radar name="Primera auditoría" dataKey="inicial" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.12} strokeDasharray="4 3" />}
          <Radar name="Última auditoría" dataKey="actual" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.28} strokeWidth={2} />
          <Tooltip {...tip} formatter={(v) => `${Number(v).toLocaleString("es-ES")} / 100`} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineaKpi({ datos, objetivo, unidad, alto = 180, mini = false }: {
  datos: { periodo: string; valor: number }[]; objetivo?: number | null; unidad: string; alto?: number; mini?: boolean;
}) {
  const fmt = (v: number) => `${v.toLocaleString("es-ES", { maximumFractionDigits: 2 })}${unidad === "%" ? " %" : unidad ? " " + unidad : ""}`;
  if (mini) {
    return (
      <div style={{ height: alto }} className="w-full">
        <ResponsiveContainer>
          <AreaChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <Area dataKey="valor" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.12}
              dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
            {objetivo != null && <ReferenceLine y={objetivo} stroke="var(--muted-foreground)" strokeDasharray="3 3" />}
            <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer>
        <LineChart data={datos} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="periodo" tick={eje} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis tick={eje} tickLine={false} axisLine={false} width={44} domain={["auto", "auto"]} />
          {objetivo != null && (
            <ReferenceLine y={objetivo} stroke="var(--ok)" strokeDasharray="4 3">
              <Label value={`Objetivo ${fmt(objetivo)}`} position="insideTopRight" fill="var(--ok)" fontSize={11} />
            </ReferenceLine>
          )}
          <Line dataKey="valor" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--chart-1)" }} isAnimationActive={false} />
          <Tooltip {...tip} formatter={(v) => fmt(Number(v))} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MatrizPrioridades({ puntos }: { puntos: { id: string; titulo: string; impacto: number; esfuerzo: number }[] }) {
  // Pequeño desplazamiento para que no se solapen puntos iguales
  const vistos: Record<string, number> = {};
  const datos = puntos.map((p) => {
    const k = `${p.impacto}-${p.esfuerzo}`; const n = (vistos[k] = (vistos[k] ?? 0) + 1) - 1;
    return { ...p, x: p.esfuerzo + (n % 3) * 0.12 - 0.12, y: p.impacto + Math.floor(n / 3) * 0.12 };
  });
  return (
    <div className="relative h-80 w-full">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 pb-7 pl-9 pr-3 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="p-2">Victorias rápidas</span><span className="p-2 text-right">Proyectos clave</span>
        <span className="self-end p-2">Rellenos</span><span className="self-end p-2 text-right">Evitar</span>
      </div>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis type="number" dataKey="x" domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]} tick={eje} name="Esfuerzo"
            label={{ value: "Esfuerzo →", position: "insideBottomRight", offset: -2, fill: "var(--muted-foreground)", fontSize: 11 }} />
          <YAxis type="number" dataKey="y" domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]} tick={eje} name="Impacto"
            label={{ value: "Impacto →", angle: -90, position: "insideLeft", offset: 24, fill: "var(--muted-foreground)", fontSize: 11 }} />
          <ZAxis range={[90, 90]} />
          <ReferenceLine x={3} stroke="var(--input)" />
          <ReferenceLine y={3} stroke="var(--input)" />
          <Scatter data={datos} fill="var(--chart-1)" fillOpacity={0.85} isAnimationActive={false} />
          <Tooltip {...tip} cursor={false}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof datos)[number] | undefined;
              return p ? <div className="max-w-60 rounded-sm border bg-card px-2.5 py-1.5 text-xs shadow"><b>{p.titulo}</b><br />Impacto {p.impacto} · Esfuerzo {p.esfuerzo}</div> : null;
            }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ingeniería de menú: popularidad (mix de ventas) frente a margen por ración. */
export function MatrizMenu({ puntos, umbralMix, margenMedio }: {
  puntos: { nombre: string; mix: number; margen: number; clase: string }[]; umbralMix: number; margenMedio: number;
}) {
  const color: Record<string, string> = { estrella: "var(--ok)", caballo: "var(--accent)", puzzle: "var(--chart-2)", perro: "var(--bad)" };
  const datos = puntos.map((p) => ({ ...p, x: Math.round(p.mix * 1000) / 10, y: Math.round(p.margen * 100) / 100 }));
  const maxX = Math.max(umbralMix * 100 * 2, ...datos.map((d) => d.x)) * 1.1;
  return (
    <div className="relative h-80 w-full">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 pb-8 pl-12 pr-3 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="p-2">Puzzle</span><span className="p-2 text-right">Estrella</span>
        <span className="self-end p-2">Perro</span><span className="self-end p-2 text-right">Caballo</span>
      </div>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: -4 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis type="number" dataKey="x" domain={[0, Math.ceil(maxX)]} tick={eje} unit=" %"
            label={{ value: "Popularidad (mix de ventas) →", position: "insideBottomRight", offset: -4, fill: "var(--muted-foreground)", fontSize: 11 }} />
          <YAxis type="number" dataKey="y" tick={eje} unit=" €" width={56}
            label={{ value: "Margen por ración →", angle: -90, position: "insideLeft", offset: 14, fill: "var(--muted-foreground)", fontSize: 11 }} />
          <ZAxis range={[110, 110]} />
          <ReferenceLine x={Math.round(umbralMix * 1000) / 10} stroke="var(--input)" strokeDasharray="4 3" />
          <ReferenceLine y={Math.round(margenMedio * 100) / 100} stroke="var(--input)" strokeDasharray="4 3" />
          <Scatter data={datos} isAnimationActive={false} shape={(props: { cx?: number; cy?: number; payload?: { clase: string } }) =>
            <circle cx={props.cx} cy={props.cy} r={7} fill={color[props.payload?.clase ?? ""] ?? "var(--chart-1)"} fillOpacity={0.9} stroke="var(--card)" strokeWidth={1.5} />} />
          <Tooltip {...tip} cursor={false}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof datos)[number] | undefined;
              return p ? <div className="rounded-sm border bg-card px-2.5 py-1.5 text-xs shadow"><b>{p.nombre}</b><br />Mix {p.x.toLocaleString("es-ES")} % · margen {p.y.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div> : null;
            }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ventas mensuales (barras) con EBITDA y food cost (líneas). */
export function VentasMensuales({ datos }: { datos: { mes: string; ventas: number; ebitda: number | null; fc: number | null; antes: boolean }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={datos} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="mes" tick={eje} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis yAxisId="e" tick={eje} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `${Math.round(v / 1000)} k€`} />
          <YAxis yAxisId="p" orientation="right" tick={eje} tickLine={false} axisLine={false} width={40} domain={[0, 50]} tickFormatter={(v) => `${v} %`} />
          <Bar yAxisId="e" dataKey="ventas" name="Ventas" fill="var(--chart-1)" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {datos.map((d, i) => <Cell key={i} fill={d.antes ? "var(--chart-2)" : "var(--chart-1)"} fillOpacity={0.85} />)}
          </Bar>
          <Line yAxisId="e" dataKey="ebitda" name="EBITDA" stroke="var(--ok)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
          <Line yAxisId="p" dataKey="fc" name="Food cost" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} isAnimationActive={false} connectNulls />
          <Tooltip {...tip} formatter={(v, n) => (n === "Food cost" ? `${Number(v).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %` : Number(v).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
