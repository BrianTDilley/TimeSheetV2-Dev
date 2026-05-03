import React, { useState } from 'react';
import { GOOGLE_SCRIPT_URL } from '../constants';
import { Button } from './ui/Button';
import { Employee, Procedure, LoginResponse } from '../types';

interface LoginProps {
  onLogin: (email: string, employee: Employee, procedures: Record<string, Procedure>) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('savedEmail') || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();
    
    if (!cleanEmail || !cleanPin) {
        setError('Please enter both email and PIN.');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        const payload = {
            action: 'login',
            email: cleanEmail,
            pin: cleanPin
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: LoginResponse = await response.json();

        if (data.result === 'success' && data.employee && data.procedures) {
            localStorage.setItem('savedEmail', cleanEmail);
            onLogin(cleanEmail, data.employee, data.procedures);
        } else {
            setError(data.error || 'Login failed. Please check credentials.');
        }

    } catch (err) {
        console.error('Login error:', err);
        setError('Connection error. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-8 animate-fade-in">
      <div className="text-center">
        <img 
          src="https://i.imgur.com/52HoFpA.png" 
          alt="Logo" 
          className="mx-auto h-32 w-auto mb-6 object-contain"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Sheet</h1>
        <p className="text-gray-500">Secure Employee Login</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
            4-Digit PIN
          </label>
          <input
            type="password"
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            maxLength={4}
            pattern="[0-9]*"
            inputMode="numeric"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none tracking-widest text-center text-lg font-bold"
            placeholder="0000"
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center justify-center">
            {error}
          </div>
        )}

        <Button type="submit" isLoading={isLoading}>
          {isLoading ? 'Verifying...' : 'Login'}
        </Button>
      </form>
    </div>
  );
};