import { GeoLocation, ProcedureCounts, Procedure } from "./types";

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s % 60}s`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const calculateEarnings = (
  clockInStr: string,
  clockOutStr: string,
  rate: number,
  proceduresCount: ProcedureCounts,
  procedureDefinitions: Record<string, Procedure>
) => {
  const start = new Date(clockInStr).getTime();
  const end = new Date(clockOutStr).getTime();
  const durationMs = end - start;
  const hours = durationMs / (1000 * 60 * 60);
  
  const hourlyPay = hours * rate;
  
  let bonusPay = 0;
  Object.entries(proceduresCount).forEach(([key, count]) => {
    const procDef = procedureDefinitions[key];
    if (procDef) {
      bonusPay += procDef.value * count;
    }
  });

  return {
    hourly: hourlyPay,
    bonus: bonusPay,
    total: hourlyPay + bonusPay,
    hours
  };
};

export const getGeoLocation = (): Promise<GeoLocation | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => {
        console.error("Geo error:", error);
        resolve(null);
      }
    );
  });
};