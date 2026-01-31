// Component: VolunteerApplicationsWithCertificates
// Purpose: Show volunteer applications with past certificates from other events

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye, Check, X, AlertCircle } from 'lucide-react';
import { Skeleton } from './skeletons';

interface PastCertificate {
  id: string;
  eventName: string;
  role: string;
  issuedDate: string;
  certificateUrl: string;
}

interface Application {
  id: string;
  studentEmail: string;
  volunteerRole: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  motivationStatement: string;
  rejectionReason?: string;
  pastCertificates: PastCertificate[];
}

interface ComponentProps {
  eventId: string;
}

export default function VolunteerApplicationsWithCertificates({ eventId }: ComponentProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [certModalData, setCertModalData] = useState<PastCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, [eventId]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/organizer/volunteers/${eventId}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    try {
      const response = await fetch(`/api/organizer/volunteers/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        fetchApplications(); // Refresh
      }
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleReject = async (appId: string, reason: string) => {
    try {
      const response = await fetch(`/api/organizer/volunteers/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
      });

      if (response.ok) {
        fetchApplications(); // Refresh
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            🟡 PENDING
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            🟢 APPROVED
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            🔴 REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <p className="text-sm text-gray-600 text-center">Loading events…</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <Skeleton className="w-1/2 h-5" variant="text" />
              <Skeleton className="w-2/3 h-4 mt-2" variant="text" />
              <Skeleton className="w-1/3 h-3 mt-2" variant="text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-blue-700">Total Applications</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-yellow-700">Pending</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-green-700">Approved</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-red-700">Rejected</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">No applications yet</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-gray-900">{app.studentEmail}</p>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Applied for: <strong>{app.volunteerRole}</strong> • {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  {expandedApp === app.id ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>

              {/* Expanded Content */}
              {expandedApp === app.id && (
                <div className="bg-white p-6 border-t border-gray-200 space-y-6">
                  {/* Motivation Statement */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Motivation Statement</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {app.motivationStatement || 'No statement provided'}
                    </p>
                  </div>

                  {/* Past Certificates */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      🎓 Past Certificates ({app.pastCertificates.length})
                    </h4>

                    {app.pastCertificates.length === 0 ? (
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                        No past certificates from other events
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.pastCertificates.map((cert) => (
                          <div
                            key={cert.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <p className="font-semibold text-gray-900 mb-1">{cert.eventName}</p>
                            <p className="text-sm text-gray-600 mb-2">Role: {cert.role}</p>
                            <p className="text-xs text-gray-500 mb-3">
                              Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                            </p>
                            <button
                              onClick={() => setCertModalData(cert)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View Certificate
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {app.status === 'rejected' && app.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <p className="font-semibold text-red-900 mb-1">Rejection Reason</p>
                      <p className="text-red-700">{app.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {app.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason (optional):');
                          if (reason !== null) {
                            handleReject(app.id, reason);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Certificate Modal */}
      {certModalData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setCertModalData(null)}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">{certModalData.eventName}</h3>
              <button
                onClick={() => setCertModalData(null)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <img
                src={certModalData.certificateUrl}
                alt="Certificate"
                className="w-full rounded-lg border border-gray-200"
              />

              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Role:</strong> {certModalData.role}
                </p>
                <p>
                  <strong>Issued:</strong> {new Date(certModalData.issuedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
