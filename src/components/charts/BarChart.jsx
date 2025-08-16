'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

// Register built-ins once on the client
if (typeof window !== 'undefined') {
  if (!window.__chartjs_registered) {
    Chart.register(...registerables);
    window.__chartjs_registered = true;
  }
}

/**
 * Props:
 * - labels: string[]
 * - datasets?: { label: string, data: number[] }[]   // optional; if omitted, uses {title, values}
 * - values?: number[]                                // optional fallback for single dataset
 * - title?: string                                   // used only if datasets not provided
 * - height?: number
 */
export default function BarChart({ labels = [], datasets = null, values = [], title = 'Total Voters', height = 320 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();

    const dataSetsToUse = (datasets && datasets.length)
      ? datasets
      : [{ label: title, data: values }];

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: dataSetsToUse
      },
      options: {
        plugins: { legend: { display: dataSetsToUse.length > 1 } },
        scales: { y: { beginAtZero: true } },
        responsive: true,
        maintainAspectRatio: false
      }
    });

    return () => chartRef.current?.destroy();
  }, [labels, datasets, values, title]);

  return <canvas ref={canvasRef} style={{ height }} />;
}
