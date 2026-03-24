"use client";

import { Check } from "lucide-react";

const STEP_LABELS = ["Categoria", "Itens", "Recorrência", "Agendamento", "Pagamento"];

export function CotacaoProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-start">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          // Left connector fills completely up to and including the active step
          const leftFilled = i !== 0 && (isCompleted || isActive);
          // Right connector only fills when this step is done
          const rightFilled = i !== STEP_LABELS.length - 1 && isCompleted;

          return (
            <div key={stepNum} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Left connector */}
                <div
                  className={[
                    "h-[3px] flex-1 transition-all duration-500 ease-[cubic-bezier(0.645,0.045,0.355,1)]",
                    i === 0 ? "invisible" : leftFilled ? "bg-indigo-500" : "bg-gray-200",
                  ].join(" ")}
                />
                {/* Circle */}
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ease-[cubic-bezier(0.645,0.045,0.355,1)]",
                    isCompleted
                      ? "bg-indigo-500 text-white"
                      : isActive
                      ? "bg-indigo-600 text-white ring-[6px] ring-indigo-100"
                      : "bg-gray-200 text-gray-500",
                  ].join(" ")}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                {/* Right connector */}
                <div
                  className={[
                    "h-[3px] flex-1 transition-all duration-500 ease-[cubic-bezier(0.645,0.045,0.355,1)]",
                    i === STEP_LABELS.length - 1 ? "invisible" : rightFilled ? "bg-indigo-500" : "bg-gray-200",
                  ].join(" ")}
                />
              </div>
              <span
                className={[
                  "mt-1.5 whitespace-nowrap text-xs font-medium transition-colors duration-300",
                  isActive ? "text-indigo-600" : isCompleted ? "text-indigo-400" : "text-gray-400",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
