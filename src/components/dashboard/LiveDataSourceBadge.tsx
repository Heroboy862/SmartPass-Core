import React from "react";
import { BoardingStatus, FlightSource } from "../../types";

interface LiveDataSourceBadgeProps {
  boardingStatus: BoardingStatus;
  airportOperator: string;
  source?: FlightSource;
}

export function LiveDataSourceBadge({
  boardingStatus,
  airportOperator,
  source
}: LiveDataSourceBadgeProps) {
  const isSimulation = source?.provider === "SIMULATION";

  return (
    <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-200 p-2.5 px-3.5 rounded-2xl shadow-xs">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${boardingStatus === "Cancelled" ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}></div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          CANLI VERİ KAYNAĞI:
        </span>
      </div>
      {isSimulation ? (
        <span className="bg-amber-600 text-white font-mono text-[9px] uppercase font-bold px-3 py-0.5 rounded shadow-xs">
          Demo mod
        </span>
      ) : (
        <span className="bg-indigo-900 text-white font-mono text-[9px] uppercase font-bold px-2.5 py-0.5 rounded shadow-xs">
          {airportOperator} LIVE HUB
        </span>
      )}
    </div>
  );
}
