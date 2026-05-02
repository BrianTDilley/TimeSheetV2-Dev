import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface EditClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTime: string, reason: string) => void;
  currentClockInTime: string;
  isProcessing: boolean;
}

export const EditClockInModal: React.FC<EditClockInModalProps> = ({ isOpen, onClose, onSubmit, currentClockInTime, isProcessing }) => {
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen && currentClockInTime) {
      const date = new Date(currentClockInTime);
      const formatted = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + 'T' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
      setTime(formatted);
    }
  }, [isOpen, currentClockInTime]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Edit Clock-In Time
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Clock-In Time</label>
                <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why are you editing your clock-in time?" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button variant="primary" onClick={() => onSubmit(time, reason)} isLoading={isProcessing} disabled={!time || !reason.trim()} className="w-full sm:ml-3 sm:w-auto mt-3 sm:mt-0">Save Time</Button>
            <Button onClick={onClose} disabled={isProcessing} variant="ghost" className="w-full sm:w-auto mt-3 sm:mt-0">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
