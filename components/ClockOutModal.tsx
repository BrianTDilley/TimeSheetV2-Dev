import React from 'react';
import { ProcedureCounts, Procedure } from '../types';
import { Button } from './ui/Button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clockOutTime: string) => void;
  onDeleteShift?: () => void;
  procedures: ProcedureCounts;
  allProcedures: Record<string, Procedure>;
  isProcessing: boolean;
}

export const ClockOutModal: React.FC<ClockOutModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onDeleteShift,
  procedures,
  allProcedures,
  isProcessing
}) => {
  const [clockOutTime, setClockOutTime] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const formatted = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      setClockOutTime(formatted);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasProcedures = Object.keys(procedures).some(key => procedures[key] > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Confirm Shift End
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clock-Out Time</label>
                    <input 
                      type="datetime-local" 
                      value={clockOutTime} 
                      onChange={(e) => setClockOutTime(e.target.value)} 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Adjust this if you forgot to clock out earlier.
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Please verify your procedures for this session.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-48 overflow-y-auto">
                    {hasProcedures ? (
                      <ul className="space-y-1">
                        {(Object.entries(procedures) as [string, number][]).map(([key, count]) => (
                          count > 0 && (
                            <li key={key} className="flex justify-between items-center text-xs">
                              <span className="text-gray-700 font-medium">{allProcedures[key]?.name || key}</span>
                              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                {count}
                              </span>
                            </li>
                          )
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                        <AlertTriangle className="h-6 w-6 mb-2 opacity-50" />
                        <span className="text-xs italic">No procedures recorded.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:justify-between items-center gap-2">
            <div className="flex flex-col sm:flex-row-reverse gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => onConfirm(clockOutTime)} 
                isLoading={isProcessing}
                variant="primary"
                className="w-full sm:w-auto"
                disabled={!clockOutTime}
              >
                Confirm & Clock Out
              </Button>
              <Button 
                onClick={onClose}
                disabled={isProcessing}
                variant="ghost"
                className="w-full sm:w-auto mt-3 sm:mt-0"
              >
                Back
              </Button>
            </div>
            {onDeleteShift && (
              <button
                onClick={onDeleteShift}
                disabled={isProcessing}
                className="w-full sm:w-auto mt-4 sm:mt-0 text-red-600 text-sm hover:underline flex justify-center items-center font-medium"
              >
                Delete Shift (Error)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};