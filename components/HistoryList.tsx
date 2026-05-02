import React from 'react';
import { Session, Procedure } from '../types';
import { formatDate, formatTime, formatDuration, formatCurrency } from '../utils';
import { Clock, DollarSign, Calendar, CheckCircle, AlertCircle, RefreshCw, Trash2, Edit } from 'lucide-react';

interface HistoryListProps {
  history: Session[];
  procedures: Record<string, Procedure>;
  onRetrySync: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
  onEditSession: (session: Session) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, procedures, onRetrySync, onDeleteSession, onEditSession }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-400">No work history found.</p>
      </div>
    );
  }

  // Sort by newest first
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.clockOut).getTime() - new Date(a.clockOut).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedHistory.map((session) => {
        const duration = new Date(session.clockOut).getTime() - new Date(session.clockIn).getTime();
        const isFailed = session.syncStatus === 'failed';
        const isPending = session.syncStatus === 'pending';
        const isSynced = session.syncStatus === 'synced' || !session.syncStatus; // Backward compatibility
        
        return (
          <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-gray-800 font-bold">
                <Calendar size={18} className="text-indigo-500" />
                {formatDate(session.clockIn)}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase rounded-full tracking-wide">
                    {formatDuration(duration)}
                </span>
                {/* Sync Status Badge */}
                {isSynced && <CheckCircle size={18} className="text-green-500" title="Synced to Google Sheets" />}
                {isPending && <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>}
                {isFailed && (
                    <button 
                        onClick={() => onRetrySync(session)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-colors"
                        title="Sync Failed. Tap to retry."
                    >
                        <RefreshCw size={18} />
                    </button>
                )}
                {/* Edit Shift Button */}
                <button
                    onClick={() => onEditSession(session)}
                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded-full transition-colors ml-1"
                    title="Edit Shift (Fix errors, set new time or procedures)"
                >
                    <Edit size={18} />
                </button>
                {/* Delete Shift Button */}
                <button
                    onClick={() => onDeleteSession(session)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors ml-1"
                    title="Delete Shift"
                >
                    <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Times & Location */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Clock In</p>
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-600" />
                    <span className="font-medium">{formatTime(session.clockIn)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Clock Out</p>
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-red-500" />
                    <span className="font-medium">{formatTime(session.clockOut)}</span>
                </div>
              </div>
            </div>

            {/* Procedures & Earnings */}
            <div className="bg-gray-50 rounded-lg p-3">
                {Object.keys(session.procedures).length > 0 ? (
                   <div className="mb-3">
                       <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Procedures</p>
                       <ul className="grid grid-cols-2 gap-2">
                           {Object.entries(session.procedures).map(([key, count]) => (
                               <li key={key} className="flex justify-between text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                   <span className="text-gray-600">{procedures[key]?.name || key}</span>
                                   <span className="font-bold text-gray-900">{count}</span>
                               </li>
                           ))}
                       </ul>
                   </div>
                ) : (
                    <p className="text-xs text-gray-400 italic mb-3">No procedures recorded.</p>
                )}
                
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Est. Total Pay</span>
                    <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                        <DollarSign size={14} />
                        {formatCurrency(session.earnings?.total || 0)}
                    </span>
                </div>
            </div>
            
            {isFailed && (
                <div className="mt-3 bg-red-50 text-red-600 text-xs p-2 rounded flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>Sync failed. Check connection and tap retry icon.</span>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};