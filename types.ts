export interface Employee {
  name: string;
  rate: number;
  category: string;
  // PIN is removed from client-side interface for security
}

export interface Procedure {
  name: string;
  value: number;
  category: string;
  employeeOnly?: string;
}

export interface GeoLocation {
  lat: number;
  lon: number;
}

export interface ProcedureCounts {
  [key: string]: number;
}

export interface Session {
  id: string;
  clockIn: string; // ISO Date String
  clockOut: string; // ISO Date String
  locations: {
    clockIn: GeoLocation | null;
    clockOut: GeoLocation | null;
  };
  procedures: ProcedureCounts;
  earnings: {
    hourly: number;
    bonus: number;
    total: number;
    hours: number;
  };
  reason?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface EmployeeData {
  currentClockIn: {
    time: string;
    location: GeoLocation | null;
    reason?: string;
    procedures?: ProcedureCounts;
  } | null;
  history: Session[];
}

export interface AppData {
  [email: string]: EmployeeData;
}

export interface LoginResponse {
  result: 'success' | 'error';
  error?: string;
  employee?: Employee;
  procedures?: Record<string, Procedure>;
}

export interface GoogleSheetPayload {
  action?: 'login' | 'clockOut' | 'phoneDay' | 'deleteShift' | 'instagram';
  email?: string;
  pin?: string;
  employeeName?: string;
  category?: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: string;
  locationIn?: string;
  locationOut?: string;
  hourlyPay?: string;
  bonusPay?: string;
  totalPay?: string;
  reason?: string;
  [key: string]: string | number | ProcedureCounts | undefined; 
}