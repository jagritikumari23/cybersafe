'use client';

import { useState, useEffect } from 'react';
import type { Report } from '@/lib/types';
import { Incident } from '@/lib/types/incident';

export default function IncidentsList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/reports');
        const reports = await response.json();
        if (!response.ok) throw new Error(reports.error || 'Failed to fetch reports.');
        setIncidents((reports as Report[]).map((report): Incident => ({
          id: report.id,
          title: report.type,
          description: report.description,
          category: report.aiTriage?.category || report.type,
          severity: report.aiTriage?.urgency?.toLowerCase() === 'high' ? 'high' : 'medium',
          status: report.status === 'Case Closed' ? 'resolved' : 'in_review',
          userId: '',
          createdAt: report.submissionDate,
        })));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
        setError('Failed to load incidents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new incident report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div key={incident.id} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{incident.title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {incident.description}
              </p>
            </div>
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                incident.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : incident.status === 'resolved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {incident.status.replace('_', ' ')}
            </span>
          </div>
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex justify-between text-sm text-gray-500">
              <div>
                <span className="font-medium">Severity: </span>
                <span className="capitalize">{incident.severity}</span>
              </div>
              <div>
                <span className="font-medium">Reported: </span>
                <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
              <div className="mt-2">
                <span className="text-sm font-medium text-gray-500">Evidence: </span>
                <div className="mt-1 flex space-x-2">
                  {incident.evidenceUrls.map((url, index) => (
                    <a 
                      key={index} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Evidence {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
