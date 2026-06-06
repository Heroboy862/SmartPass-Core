import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface OperatorPieChartProps {
  activeOperator?: string;
}

export default function OperatorPieChart({ activeOperator }: OperatorPieChartProps) {
  const [operatorData, setOperatorData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const counts: Record<string, number> = {
      "İGA": 3,
      "HEAŞ": 2,
      "TAV": 2,
      "DHMİ": 1
    };

    // Safely increment the active flight's operator in the summary distribution
    if (activeOperator && counts[activeOperator] !== undefined) {
      counts[activeOperator] += 1;
    }

    const colorsMap: Record<string, string> = {
      "İGA": "#4F46E5",  // Indigo 600
      "HEAŞ": "#F97316", // Orange 500
      "TAV": "#008080",  // Teal
      "DHMİ": "#64748B"  // Slate 500
    };

    const chartData = Object.keys(counts).map(name => ({
      name,
      value: counts[name],
      color: colorsMap[name] || "#94A3B8"
    })).filter(item => item.value > 0);

    setOperatorData(chartData);
  }, [activeOperator]);

  return (
    <div className="h-44 w-full flex items-center justify-between mt-3 font-sans">
      <div className="relative w-[50%] h-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={operatorData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={4}
              dataKey="value"
            >
              {operatorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: "#0f172a", border: "0", borderRadius: "12px", fontSize: "10px", color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-[45%] flex flex-col gap-2">
        {operatorData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-[10px] font-semibold">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}</span>
            </div>
            <span className="font-mono text-slate-800 font-bold bg-slate-50 px-1 rounded border border-slate-100 ml-1">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
