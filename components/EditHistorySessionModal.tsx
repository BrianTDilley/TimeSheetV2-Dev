import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { ProcedureTracker } from './ProcedureTracker';
import { ProcedureCounts, Procedure, Session } from '../types';

interface EditHistorySessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, startTime: string, endTime: string, procedures: ProcedureCounts, reason: string) => void;
  isProcessing: boolean;
  employeeCategory: string;
  employeeEmail: string;
  allProcedures: Record<string, Procedure>;
}

export const EditHistorySessionModal: React.FC<EditHistorySessionModalProps> = ({ 
    session, isOpen, onClose, onSubmit, isProcessing, employeeCategory, employeeEmail, allProcedures 
}) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [procedures, setProcedures] = useState<ProcedureCounts>({});

  useEffect(() => {
    if (isOpen && session) {
      const formatLocal = (dateString: string) => {
        const date = new Date(dateString);
        return date.getFullYear() + '-' + 
            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(date.getDate()).padStart(2, '0') + 'T' + 
            String(date.getHours()).padStart(2, '0') + ':' + 
            String(date.getMinutes()).padStart(2, '0');
      };
      setStartTime(formatLocal(session.clockIn));
      setEndTime(formatLocal(session.clockOut));
      setReason(session.reason || '');
      setProcedures(session.procedures || {});
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
              Edit Shift
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Clock In Time</label>
                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Clock Out Time</label>
                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Edit</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Explain why you are editing this shift" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              
              <div className="pt-2">
                 <ProcedureTracker 
                    counts={procedures}
                    onChange={setProcedures}
                    employeeCategory={employeeCategory}
                    employeeEmail={employeeEmail}
                    procedures={allProcedures}
                 />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <Button variant="primary" onClick={() => onSubmit(session.id, startTime, endTime, procedures, reason)} isLoading={isProcessing} disabled={!startTime || !endTime || !reason.trim()} className="w-full sm:ml-3 sm:w-auto mt-3 sm:mt-0">Save Changes</Button>
            <Button onClick={onClose} disabled={isProcessing} variant="ghost" className="w-full sm:w-auto mt-3 sm:mt-0">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
