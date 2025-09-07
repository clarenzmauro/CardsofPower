"use client";

import { ResponsivePie } from "@nivo/pie";
import { chartColors, ensureFiniteNumber } from "./chart-colors";
import React from "react";

export interface PieDatum {
  id: string;
  label: string;
  value: number;
}

interface NivoSimplePieProps {
  data: PieDatum[];
  height?: number;
}

export function NivoSimplePie({ data, height = 260 }: NivoSimplePieProps) {
  const safeData = Array.isArray(data)
    ? data.map((d, i) => ({
        id: String(d?.id ?? i),
        label: String(d?.label ?? String(i)),
        value: ensureFiniteNumber(d?.value ?? 0),
      }))
    : [];

  return (
    <div style={{ height }}>
      <ResponsivePie
        data={safeData}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        innerRadius={0.5}
        padAngle={1}
        cornerRadius={3}
        activeOuterRadiusOffset={6}
        colors={chartColors.categorical}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={chartColors.axis}
        arcLabelsTextColor={chartColors.label}
        theme={{
          grid: { line: { stroke: chartColors.grid, strokeWidth: 1 } },
          tooltip: {
            container: { background: chartColors.tooltipBg, color: chartColors.tooltipText, fontSize: 12, borderRadius: 6 },
          },
          labels: { text: { fill: chartColors.label } },
        }}
        role="img"
        arcLabel="pie chart"
      />
    </div>
  );
}


