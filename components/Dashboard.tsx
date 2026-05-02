import React, { useState, useEffect } from 'react';
import { GOOGLE_SCRIPT_URL, APP_STORAGE_KEY, PHONE_DAY_ELIGIBLE_EMAILS } from '../constants';
import { AppData, EmployeeData, ProcedureCounts, Session, GoogleSheetPayload, Employee, Procedure } from '../types';
import { getGeoLocation, calculateEarnings, formatTime } from '../utils';
import { Button } from './ui/Button';
import { ProcedureTracker } from './ProcedureTracker';
import { HistoryList } from './HistoryList';
import { ClockOutModal } from './ClockOutModal';
import { ManualShiftModal } from './ManualShiftModal';
import { EditClockInModal } from './EditClockInModal';
import { EditHistorySessionModal } from './EditHistorySessionModal';
import { MapPin, LogOut, PlayCircle, StopCircle, Lock, Phone } from 'lucide-react';

interface DashboardProps {
  email: string;
  employee: Employee;
  procedures: Record<string, Procedure>;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ email, employee, procedures, onLogout }) => {
  const [data, setData] = useState<EmployeeData>({ currentClockIn: null, history: [] });
  const [currentProcedures, setCurrentProcedures] = useState<ProcedureCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Modals
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [isManualShiftModalOpen, setIsManualShiftModalOpen] = useState(false);
  const [isEditClockInModalOpen, setIsEditClockInModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem(APP_STORAGE_KEY);
    if (stored) {
      const parsed: AppData = JSON.parse(stored);
      if (parsed[email]) {
        setData(parsed[email]);
      }
    }
  }, [email]);

  // Persist data whenever it changes
  useEffect(() => {
    const stored = localStorage.getItem(APP_STORAGE_KEY);
    const parsed: AppData = stored ? JSON.parse(stored) : {};
    parsed[email] = data;
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(parsed));
  }, [data, email]);

  const handleClockIn = async () => {
    setIsLoading(true);
    setLoadingText('Verifying Location...');
    try {
      const location = await getGeoLocation();
      const now = new Date().toISOString();
      
      setData(prev => ({
        ...prev,
        currentClockIn: {
          time: now,
          location
        }
      }));
      setCurrentProcedures({});
    } catch (e) {
      alert("Failed to clock in. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const initiateClockOut = () => {
    setIsClockOutModalOpen(true);
  };

  const syncSession = async (session: Session) => {
      // 1. Construct Payload
      const payload: GoogleSheetPayload = {
          action: 'clockOut', // Explicit action
          employeeName: employee.name,
          category: employee.category,
          clockIn: formatTime(session.clockIn),
          clockOut: formatTime(session.clockOut),
          totalHours: session.earnings.hours.toFixed(2),
          locationIn: session.locations.clockIn ? `${session.locations.clockIn.lat}, ${session.locations.clockIn.lon}` : 'N/A',
          locationOut: session.locations.clockOut ? `${session.locations.clockOut.lat}, ${session.locations.clockOut.lon}` : 'N/A',
          hourlyPay: session.earnings.hourly.toFixed(2),
          bonusPay: session.earnings.bonus.toFixed(2),
          totalPay: session.earnings.total.toFixed(2),
          reason: session.reason || ''
      };

      // Flatten procedures
      (Object.entries(procedures) as [string, Procedure][]).forEach(([key, def]) => {
          const count = session.procedures[key] || 0;
          if (count > 0) {
              payload[`${def.name} [${def.category}]`] = count;
          }
      });

      try {
          // Using text/plain prevents the browser from sending an OPTIONS preflight request.
          const response = await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
          }

          const result = await response.json();
          if (result.result !== 'success') {
            throw new Error(result.error || 'Unknown script error');
          }

          // If successful (verified by server response), update status to synced
          setData(prev => ({
              ...prev,
              history: prev.history.map(s => s.id === session.id ? { ...s, syncStatus: 'synced' } : s)
          }));
      } catch (e) {
          console.error("Sync failed", e);
          // If network error or script error, update status to failed
          setData(prev => ({
              ...prev,
              history: prev.history.map(s => s.id === session.id ? { ...s, syncStatus: 'failed' } : s)
          }));
      }
  };

  const confirmClockOut = async () => {
    if (!data.currentClockIn) return;
    setIsLoading(true);
    setLoadingText('Processing...');
    
    try {
        setLoadingText('Verifying Location...');
        const location = await getGeoLocation();
        
        const clockOutTime = new Date().toISOString();
        const earnings = calculateEarnings(
            data.currentClockIn.time, 
            clockOutTime, 
            employee.rate, 
            currentProcedures, 
            procedures
        );

        const newSession: Session = {
            id: crypto.randomUUID(),
            clockIn: data.currentClockIn.time,
            clockOut: clockOutTime,
            locations: {
                clockIn: data.currentClockIn.location,
                clockOut: location
            },
            procedures: currentProcedures,
            earnings: {
                hourly: earnings.hourly,
                bonus: earnings.bonus,
                total: earnings.total,
                hours: earnings.hours
            },
            syncStatus: 'pending'
        };

        // --- OPTIMISTIC UPDATE: SAVE LOCALLY FIRST ---
        setData(prev => ({
            currentClockIn: null,
            history: [...prev.history, newSession]
        }));
        
        // Reset UI immediately
        setIsClockOutModalOpen(false);
        setCurrentProcedures({});
        setIsLoading(false);
        setLoadingText('');

        // --- ATTEMPT SYNC IN BACKGROUND ---
        await syncSession(newSession);

    } catch (e) {
        console.error(e);
        alert("Error during clock out.");
        setIsLoading(false);
        setLoadingText('');
    }
  };

  const handleDeleteShift = () => {
    if (confirm("Are you sure you want to delete this shift? This cannot be undone.")) {
      setData(prev => ({ ...prev, currentClockIn: null }));
      setIsClockOutModalOpen(false);
      setCurrentProcedures({});
    }
  };

  const handleDeleteHistorySession = async (session: Session) => {
    if (!confirm("Are you sure you want to delete this shift from history? This will be removed from your records.")) return;

    // Remove from local history immediately
    setData(prev => ({
      ...prev,
      history: prev.history.filter(s => s.id !== session.id)
    }));

    try {
      const payload: GoogleSheetPayload = {
        action: 'deleteShift',
        employeeName: employee.name,
        clockIn: formatTime(session.clockIn),
        clockOut: formatTime(session.clockOut)
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to delete from remote source:", err);
    }
  };

  const handleEditClockInSubmit = (newTime: string, reason: string) => {
    setData(prev => {
        if (!prev.currentClockIn) return prev;
        return {
            ...prev,
            currentClockIn: {
                ...prev.currentClockIn,
                time: new Date(newTime).toISOString(),
                reason: reason
            }
        };
    });
    setIsEditClockInModalOpen(false);
  };

  const handleManualShiftSubmit = async (startTime: string, endTime: string, shiftProcedures: ProcedureCounts, reason: string) => {
    setIsLoading(true);
    setLoadingText('Saving Shift...');
    
    // Convert to ISO string
    const clockInIso = new Date(startTime).toISOString();
    const clockOutIso = new Date(endTime).toISOString();

    const earnings = calculateEarnings(
        clockInIso, 
        clockOutIso, 
        employee.rate, 
        shiftProcedures, 
        procedures
    );

    const newSession: Session = {
        id: crypto.randomUUID(),
        clockIn: clockInIso,
        clockOut: clockOutIso,
        locations: { clockIn: null, clockOut: null },
        procedures: shiftProcedures,
        earnings: {
            hourly: earnings.hourly,
            bonus: earnings.bonus,
            total: earnings.total,
            hours: earnings.hours
        },
        reason: reason,
        syncStatus: 'pending'
    };

    setData(prev => ({
        ...prev,
        history: [...prev.history, newSession]
    }));
    
    setIsManualShiftModalOpen(false);
    setIsLoading(false);
    setLoadingText('');

    await syncSession(newSession);
  };

  const handleEditHistorySessionSubmit = async (id: string, startTime: string, endTime: string, shiftProcedures: ProcedureCounts, reason: string) => {
    setIsLoading(true);
    setLoadingText('Updating Shift...');

    const sessionToEdit = data.history.find(s => s.id === id);
    if (!sessionToEdit) {
        setIsLoading(false);
        return;
    }

    // First delete it remotely if it exists, since GS does not support ID updates out of the box...
    try {
      const payload: GoogleSheetPayload = {
        action: 'deleteShift',
        employeeName: employee.name,
        clockIn: formatTime(sessionToEdit.clockIn),
        clockOut: formatTime(sessionToEdit.clockOut)
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to delete old shift before replacing:", err);
    }

    // Now insert the updated version
    const clockInIso = new Date(startTime).toISOString();
    const clockOutIso = new Date(endTime).toISOString();

    const earnings = calculateEarnings(
        clockInIso, 
        clockOutIso, 
        employee.rate, 
        shiftProcedures, 
        procedures
    );

    const updatedSession: Session = {
        ...sessionToEdit,
        clockIn: clockInIso,
        clockOut: clockOutIso,
        procedures: shiftProcedures,
        earnings: {
            hourly: earnings.hourly,
            bonus: earnings.bonus,
            total: earnings.total,
            hours: earnings.hours
        },
        reason: reason || sessionToEdit.reason,
        syncStatus: 'pending' // Re-sync
    };

    setData(prev => ({
        ...prev,
        history: prev.history.map(s => s.id === id ? updatedSession : s)
    }));

    setEditingSession(null);
    setIsLoading(false);
    setLoadingText('');

    await syncSession(updatedSession);
  };

  const handleRecordPhoneDay = async () => {
    if (!confirm("Are you sure you want to record a Phone Day? This will log a $50 bonus pay entry.")) return;
    
    setIsLoading(true);
    setLoadingText('Recording Phone Day...');
    
    const payload: GoogleSheetPayload = {
        action: 'phoneDay',
        employeeName: employee.name,
        category: employee.category,
        clockIn: 'N/A',
        clockOut: 'N/A',
        totalHours: '0.00',
        locationIn: 'N/A',
        locationOut: 'N/A',
        hourlyPay: '0.00',
        bonusPay: '50.00',
        totalPay: '50.00',
        [`Phone Day [${employee.category}]`]: 1
    };

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        if (result.result !== 'success') throw new Error(result.error || 'Unknown error');

        alert("Phone Day recorded successfully!");
    } catch (e) {
        console.error("Phone Day record failed", e);
        alert("Failed to record Phone Day. Please try again.");
    } finally {
        setIsLoading(false);
        setLoadingText('');
    }
  };

  const handleRetrySync = async (session: Session) => {
      // Set to pending while retrying
      setData(prev => ({
          ...prev,
          history: prev.history.map(s => s.id === session.id ? { ...s, syncStatus: 'pending' } : s)
      }));
      await syncSession(session);
  };

  const isClockedIn = !!data.currentClockIn;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            <img src="https://i.imgur.com/52HoFpA.png" alt="Logo" className="h-16 w-auto" />
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {employee.name.split(' ')[0]}</h1>
                <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={12} /> Geolocating when Starting and Ending Shift
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock size={12} /> Secure Session Active
                    </p>
                </div>
            </div>
        </div>
        <button onClick={onLogout} className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1 transition-colors">
            <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-6 text-white text-center shadow-lg transition-colors duration-500 ${isClockedIn ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-700'}`}>
         <p className="text-sm opacity-80 font-medium tracking-wider uppercase mb-1">Current Status</p>
         <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            {isClockedIn ? (
                <>
                    <PlayCircle size={32} /> Clocked In
                </>
            ) : (
                <>
                    <StopCircle size={32} /> Off Duty
                </>
            )}
         </h2>
         
         {!isClockedIn ? (
             <div className="flex flex-col items-center gap-3">
                 <Button 
                    onClick={handleClockIn} 
                    isLoading={isLoading} 
                    variant="white"
                    className="max-w-xs w-full"
                 >
                    {isLoading ? loadingText : 'Start Shift'}
                 </Button>
                 <button onClick={() => setIsManualShiftModalOpen(true)} className="text-sm opacity-80 hover:opacity-100 underline decoration-white/50 underline-offset-4">
                     Forgot to Clock In? (Add Past Shift)
                 </button>
             </div>
         ) : (
             <div className="flex flex-col items-center gap-3">
                 <Button 
                    onClick={initiateClockOut} 
                    variant="whiteDanger" 
                    className="max-w-xs w-full"
                 >
                    End Shift
                 </Button>
                 <button onClick={() => setIsEditClockInModalOpen(true)} className="text-sm opacity-80 hover:opacity-100 underline decoration-white/50 underline-offset-4">
                     Edit Clock-In Time
                 </button>
             </div>
         )}
      </div>

      {/* Quick Actions for Eligible Users */}
      {PHONE_DAY_ELIGIBLE_EMAILS.includes(email.toLowerCase()) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <Phone size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-800">Phone Day</h3>
                    <p className="text-xs text-gray-500">Record a phone day entry ($50)</p>
                </div>
            </div>
            <Button 
                onClick={handleRecordPhoneDay} 
                isLoading={isLoading && loadingText.includes('Phone')} 
                variant="outline"
                size="sm"
                className="w-auto px-4"
            >
                Record Entry
            </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Procedures (Only visible when clocked in) */}
        {isClockedIn && (
            <div className="md:col-span-3 max-w-2xl mx-auto w-full">
                 <ProcedureTracker 
                    counts={currentProcedures} 
                    onChange={setCurrentProcedures} 
                    employeeCategory={employee.category}
                    procedures={procedures}
                 />
            </div>
        )}

        {/* Right Col: History */}
        {!isClockedIn && (
            <div className="md:col-span-3 space-y-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    Work History
                </h2>
                <div className="max-h-[600px] overflow-y-auto pr-2">
                    <HistoryList 
                        history={data.history} 
                        procedures={procedures}
                        onRetrySync={handleRetrySync} 
                        onDeleteSession={handleDeleteHistorySession}
                        onEditSession={(session) => setEditingSession(session)}
                    />
                </div>
            </div>
        )}
      </div>

      <ClockOutModal 
        isOpen={isClockOutModalOpen}
        onClose={() => setIsClockOutModalOpen(false)}
        onConfirm={confirmClockOut}
        onDeleteShift={handleDeleteShift}
        procedures={currentProcedures}
        allProcedures={procedures}
        isProcessing={isLoading}
      />

      <ManualShiftModal
        isOpen={isManualShiftModalOpen}
        onClose={() => setIsManualShiftModalOpen(false)}
        onSubmit={handleManualShiftSubmit}
        isProcessing={isLoading}
        employeeCategory={employee.category}
        allProcedures={procedures}
      />

      <EditClockInModal
        isOpen={isEditClockInModalOpen}
        onClose={() => setIsEditClockInModalOpen(false)}
        onSubmit={handleEditClockInSubmit}
        currentClockInTime={data.currentClockIn?.time || ''}
        isProcessing={isLoading}
      />

      <EditHistorySessionModal
        session={editingSession}
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        onSubmit={handleEditHistorySessionSubmit}
        isProcessing={isLoading}
        employeeCategory={employee.category}
        allProcedures={procedures}
      />
    </div>
  );
};