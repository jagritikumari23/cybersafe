import type { Report } from './types';

const REPORTS_STORAGE_KEY = 'cyberSafeReports';

export const getReportsFromStorage = (): Report[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
    return storedReports ? JSON.parse(storedReports) : [];
  } catch (error) {
    console.error("Error reading reports from localStorage:", error);
    return [];
  }
};

export const addReportToStorage = (report: Report): void => {
  if (typeof window === 'undefined') return;
  try {
    const reports = getReportsFromStorage();
    reports.unshift(report); // Add new report to the beginning
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error("Error saving report to localStorage:", error);
  }
};

export const getReportByIdFromStorage = (id: string): Report | undefined => {
  if (typeof window === 'undefined') return undefined;
  const reports = getReportsFromStorage();
  return reports.find(report => report.id === id);
};

export const updateReportInStorage = (updatedReport: Report): void => {
  if (typeof window === 'undefined') return;
  try {
    let reports = getReportsFromStorage();
    reports = reports.map(report => report.id === updatedReport.id ? updatedReport : report);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error("Error updating report in localStorage:", error);
  }
}
