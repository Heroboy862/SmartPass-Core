import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Activity } from "lucide-react";

const OperatorPieChart = lazy(() => import("./OperatorPieChart"));

interface AirportOperatorChartProps {
  activeOperator?: string;
}

export function AirportOperatorChart({ activeOperator }: AirportOperatorChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Disconnect to load only once when first viewed
        }
      },
      { threshold: 0.1, rootMargin: "50px" } // Load slightly prior to entering the viewport for seamless UX
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-left min-h-[220px]"
    >
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Havalimanı Operatör Payları</h4>
      </div>

      {isVisible ? (
        <Suspense 
          fallback={
            <div className="h-44 w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] text-slate-400 font-semibold">Grafik Hazırlanıyor...</span>
              </div>
            </div>
          }
        >
          <OperatorPieChart activeOperator={activeOperator} />
        </Suspense>
      ) : (
        <div className="h-44 w-full flex items-center justify-between mt-3 animate-pulse">
          <div className="w-[50%] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-8 border-slate-100 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50" />
            </div>
          </div>
          <div className="w-[45%] flex flex-col gap-2.5">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-4/5" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      )}
    </div>
  );
}
