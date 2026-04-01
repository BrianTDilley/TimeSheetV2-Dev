import React from 'react';
import { ProcedureCounts, Procedure } from '../types';
import { Minus, Plus } from 'lucide-react';

interface ProcedureTrackerProps {
  counts: ProcedureCounts;
  onChange: (newCounts: ProcedureCounts) => void;
  employeeCategory: string;
  procedures: Record<string, Procedure>;
}

export const ProcedureTracker: React.FC<ProcedureTrackerProps> = ({ counts, onChange, employeeCategory, procedures }) => {
  
  const handleIncrement = (key: string) => {
    onChange({
      ...counts,
      [key]: (counts[key] || 0) + 1
    });
  };

  const handleDecrement = (key: string) => {
    if (!counts[key] || counts[key] <= 0) return;
    onChange({
      ...counts,
      [key]: counts[key] - 1
    });
  };

  // Filter procedures that match the employee's category
  const visibleProcedures = (Object.entries(procedures) as [string, Procedure][]).filter(
    ([_, proc]) => proc.category === employeeCategory
  );

  if (visibleProcedures.length === 0) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">No procedures available for your category ({employeeCategory}).</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Session Procedures</h3>
        <p className="text-xs text-gray-500 mt-0.5">Track items for bonus pay</p>
      </div>
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {visibleProcedures.map(([key, proc]) => (
          <div key={key} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 text-sm">{proc.name}</span>
              <span className="text-xs text-gray-400 font-medium tracking-wide">${proc.value.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecrement(key)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition active:bg-gray-300"
                aria-label="Decrease count"
              >
                <Minus size={14} />
              </button>
              <div className="w-8 text-center font-bold text-sm text-indigo-900">
                {counts[key] || 0}
              </div>
              <button
                onClick={() => handleIncrement(key)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition active:bg-indigo-200"
                aria-label="Increase count"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};