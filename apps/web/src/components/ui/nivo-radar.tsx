"use client";

import { ResponsiveRadar } from "@nivo/radar";
import React from "react";
import { chartColors, ensureFiniteNumber } from "./chart-colors";

export interface RadarDatum {
  subject: string;
  A: number;
}

interface NivoSimpleRadarProps {
  data: RadarDatum[];
  height?: number;
  seriesKey?: string; // defaults to 'A'
}

export function NivoSimpleRadar({ data, height = 260, seriesKey = "A" }: NivoSimpleRadarProps) {
  const keys = [seriesKey];
  const indexBy = "subject";

  const safeData = Array.isArray(data)
    ? data.map(d => ({
        subject: String(d?.subject ?? ""),
        [seriesKey]: ensureFiniteNumber((d as any)?.[seriesKey] ?? d?.A ?? 0),
      }))
    : [];

  return (
    <div style={{ height }}>
      <ResponsiveRadar
        data={safeData}
        keys={keys}
        indexBy={indexBy}
        maxValue={100}
        valueFormat=".0f"
        margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
        borderColor={{ from: 'color' }}
        gridLabelOffset={16}
        dotSize={6}
        dotBorderWidth={1}
        colors={[chartColors.categorical[4]]}
        blendMode="multiply"
        motionConfig="gentle"
        theme={{
          grid: { line: { stroke: '#d1d5db', strokeWidth: 1 } },
          axis: { ticks: { text: { fill: '#111827', fontSize: 11 } }, legend: { text: { fill: '#111827' } } },
          tooltip: { container: { background: chartColors.tooltipBg, color: chartColors.tooltipText, fontSize: 12, borderRadius: 6 } },
          labels: { text: { fill: '#111827' } },
        }}
      />
    </div>
  );
}


