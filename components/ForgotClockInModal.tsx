import React, { useState } from 'react';
import { Button } from './ui/Button';

interface ForgotClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (startTime: string) => void;
  isProcessing: boolean;
}

export const ForgotClockInModal: React.FC<ForgotClockInModalProps> = ({ 
    isOpen, onClose, onSubmit, isProcessing 
}) => {
  const [startTime, setStartTime] = useState('');

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
        setStartTime('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Forgot to Clock In?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Enter the time you actually started working. This will start an active shift.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Clock In Time</label>
                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <Button variant="primary" onClick={() => onSubmit(startTime)} isLoading={isProcessing} disabled={!startTime} className="w-full sm:ml-3 sm:w-auto mt-3 sm:mt-0">Start Active Shift</Button>
            <Button onClick={onClose} disabled={isProcessing} variant="ghost" className="w-full sm:w-auto mt-3 sm:mt-0">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
