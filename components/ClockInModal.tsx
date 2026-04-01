import React, { useState } from 'react';
import { Button } from './ui/Button';
import { SignaturePad } from './ui/SignaturePad';
import { PlayCircle } from 'lucide-react';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signature: string) => void;
  isProcessing: boolean;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isProcessing
}) => {
  const [signature, setSignature] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <PlayCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Start Shift
                </h3>
                <div className="mt-2 space-y-4">
                  <p className="text-sm text-gray-500">
                    Please sign below to verify your identity and start your shift.
                  </p>
                  
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Employee Signature
                    </label>
                    <SignaturePad onEnd={setSignature} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <Button 
              onClick={() => signature && onConfirm(signature)} 
              isLoading={isProcessing}
              variant="primary"
              disabled={!signature}
              className="w-full sm:w-auto"
            >
              Confirm Clock In
            </Button>
            <Button 
              onClick={onClose}
              disabled={isProcessing}
              variant="ghost"
              className="w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};