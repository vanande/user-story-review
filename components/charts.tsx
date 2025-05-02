"use client";

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ChartProps {
  data: Array<{ name: string; value: number }>;
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
  height?: number;
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => String(value),
  height = 300,
}: ChartProps) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: categories[0],
        data: data.map((item) => item.value),
        backgroundColor: colors[0],
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => valueFormatter(context.raw),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => valueFormatter(value),
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function PieChart({ data, index, categories, colors, height = 300 }: ChartProps) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: colors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
