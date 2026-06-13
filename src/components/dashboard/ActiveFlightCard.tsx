import React from "react";
import { Plane, Database } from "lucide-react";
import { FlightInfo, BoardingStatus } from "../../types";
import { useFlightStore } from "../../store/useFlightStore";

interface ActiveFlightCardProps {
  flightData: FlightInfo;
  getStatusColor: (status: BoardingStatus) => string;
  getStatusLabelText: (status: BoardingStatus) => string;
}

export function ActiveFlightCard({
  flightData,
  getStatusColor,
  getStatusLabelText
}: ActiveFlightCardProps) {
  const { isOnline } = useFlightStore();
  return (
    <div className="bg-indigo-900 rounded-3xl text-white p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      {/* Subtle aircraft shadow graphic in background */}
      <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
        <Plane className="w-56 h-56 -rotate-45 block" />
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">UÇUŞ NUMARASI</p>
          <h2 className="text-3xl font-black font-display tracking-tight text-white">{flightData.flightNumber}</h2>
        </div>
        <div className="text-right flex flex-col items-end gap-1.5">
          {!isOnline && (
            <span id="offline-cache-badge" className="bg-amber-500 text-slate-950 text-[7.5px] uppercase font-black px-2 py-0.5 rounded-md border border-amber-400 tracking-wider flex items-center gap-1 shadow-md shrink-0">
              <Database className="w-2.5 h-2.5" />
              ÇEVRİMDIŞI ÖNBELLEK
            </span>
          )}
          <span className={`text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 shadow-md ${getStatusColor(flightData.boardingStatus)}`}>
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0"></span>
            {getStatusLabelText(flightData.boardingStatus)}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between my-5">
        <div className="text-left">
          <p className="text-4xl font-black tracking-tighter text-white font-display leading-none">{flightData.from}</p>
          <p className="text-[10px] text-indigo-200 font-semibold truncate max-w-[100px] mt-1">{flightData.fromCity}</p>
        </div>
        
        <div className="flex-1 px-4 relative flex items-center justify-center">
          <div className="w-full h-px border-t border-dashed border-indigo-400/40"></div>
          <Plane className="w-4 h-4 text-indigo-300 absolute left-1/2 -translate-x-1/2 -top-1.5" />
        </div>

        <div className="text-right">
          <p className="text-4xl font-black tracking-tighter text-white font-display leading-none">{flightData.to}</p>
          <p className="text-[10px] text-indigo-200 font-semibold truncate max-w-[100px] mt-1">{flightData.toCity}</p>
        </div>
      </div>

      <div className="border-t border-indigo-800/80 mt-2 pt-4 flex justify-between items-center text-xs relative z-10">
        <div className="flex gap-4">
          <div>
            <span className="text-[8px] text-indigo-300 uppercase font-bold tracking-wider block">YOLCU</span>
            <span className="font-bold text-slate-100 truncate block max-w-[90px]">{flightData.passengerName}</span>
          </div>
          <div>
            <span className="text-[8px] text-indigo-300 uppercase font-bold tracking-wider block">PLANLANAN (STD)</span>
            <span className="font-mono font-bold text-slate-100">{flightData.schedule?.std || flightData.departureTime}</span>
          </div>
          {flightData.boardingStatus === "Delayed" && flightData.schedule?.etd && (
            <div>
              <span className="text-[8px] text-amber-300 uppercase font-bold tracking-wider block">TAHMİNÎ (ETD)</span>
              <span className="font-mono font-bold text-amber-300 animate-pulse">{flightData.schedule.etd}</span>
            </div>
          )}
          {flightData.boardingStatus === "Closed" && flightData.schedule?.atd && (
            <div>
              <span className="text-[8px] text-emerald-300 uppercase font-bold tracking-wider block">KALKIŞ (ATD)</span>
              <span className="font-mono font-bold text-emerald-300">{flightData.schedule.atd}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-[8px] font-mono text-indigo-300 tracking-tighter uppercase font-semibold block">{flightData.airline}</span>
          {flightData.source?.confidence && (
            <span className="text-[7.5px] font-mono text-indigo-400 font-bold uppercase block">GÜVEN: %{Math.round(flightData.source.confidence * 100)}</span>
          )}
          {!isOnline && (
            <span className="text-[6.5px] font-mono text-amber-300 font-black uppercase tracking-wider block animate-pulse mt-0.5">LOCAL SECURE CACHE</span>
          )}
        </div>
      </div>
    </div>
  );
}
