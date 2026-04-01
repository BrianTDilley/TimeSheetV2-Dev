import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { SESSION_KEY, SECURE_SESSION_DATA_KEY } from './constants';
import { Employee, Procedure } from './types';

interface SecureSession {
  employee: Employee;
  procedures: Record<string, Procedure>;
}

const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [secureData, setSecureData] = useState<SecureSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage for existing login
    const savedEmail = sessionStorage.getItem(SESSION_KEY);
    const savedSecureData = sessionStorage.getItem(SECURE_SESSION_DATA_KEY);
    
    if (savedEmail && savedSecureData) {
      setCurrentUserEmail(savedEmail);
      try {
        setSecureData(JSON.parse(savedSecureData));
      } catch (e) {
        console.error("Failed to parse secure session data");
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SECURE_SESSION_DATA_KEY);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string, employee: Employee, procedures: Record<string, Procedure>) => {
    const sessionData = { employee, procedures };
    
    sessionStorage.setItem(SESSION_KEY, email);
    sessionStorage.setItem(SECURE_SESSION_DATA_KEY, JSON.stringify(sessionData));
    
    setCurrentUserEmail(email);
    setSecureData(sessionData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SECURE_SESSION_DATA_KEY);
    setCurrentUserEmail(null);
    setSecureData(null);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {currentUserEmail && secureData ? (
        <Dashboard 
            email={currentUserEmail} 
            employee={secureData.employee}
            procedures={secureData.procedures}
            onLogout={handleLogout} 
        />
      ) : (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Login onLogin={handleLogin} />
        </div>
      )}
    </div>
  );
};

export default App;