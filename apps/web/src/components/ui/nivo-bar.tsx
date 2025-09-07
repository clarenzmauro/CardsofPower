"use client";

import { ResponsiveBar } from "@nivo/bar";
import { chartColors, ensureFiniteNumber } from "./chart-colors";
import React from "react";

export interface BarDatum {
  name: string;
  value: number;
}

interface NivoSimpleBarProps {
  data: BarDatum[];
  height?: number;
}

export function NivoSimpleBar({ data, height = 180 }: NivoSimpleBarProps) {
  const safeData = Array.isArray(data)
    ? data.map(d => ({ name: String(d?.name ?? ""), value: ensureFiniteNumber(d?.value ?? 0) }))
    : [];

  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={safeData}
        keys={["value"]}
        indexBy="name"
        margin={{ top: 10, right: 10, bottom: 24, left: 36 }}
        padding={0.3}
        colors={[chartColors.categorical[1]]}
        enableLabel={false}
        axisBottom={{ tickSize: 0, tickPadding: 6, tickRotation: 0 }}
        axisLeft={{ tickSize: 0, tickPadding: 6, tickRotation: 0 }}
        gridYValues={5}
        theme={{
          grid: { line: { stroke: chartColors.grid, strokeWidth: 1 } },
          axis: {
            ticks: { text: { fill: chartColors.axis, fontSize: 11 } },
            legend: { text: { fill: chartColors.axis } },
          },
          tooltip: {
            container: { background: chartColors.tooltipBg, color: chartColors.tooltipText, fontSize: 12, borderRadius: 6 },
          },
          labels: { text: { fill: chartColors.label } },
        }}
        role="img"
        ariaLabel="bar chart"
      />
    </div>
  );
}


