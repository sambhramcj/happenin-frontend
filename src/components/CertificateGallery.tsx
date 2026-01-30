// Component: CertificateGallery
// Purpose: Display student's certificates and badges (READ-ONLY)

'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, Eye, Trophy, Star } from 'lucide-react';

interface Certificate {
  id: string;
  student_email: string;
  certificate_url: string;
  event_name: string;
  certificate_type: 'volunteer' | 'participant' | 'winning';
  certificate_title: string;
  issued_by: string;
  sent_date: string;
  downloaded_date?: string;
}

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon_url?: string;
  earned_at: string;
}

interface Stats {
  totalCertificates: number;
  volunteer: number;
  participant: number;
  winning: number;
  totalBadges: number;
}

export default function CertificateGallery() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'volunteer' | 'participant' | 'winning'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = selectedType === 'all' ? '' : `?type=${selectedType}`;
      const response = await fetch(`/api/student/certificates${query}`);
      const data = await response.json();

      if (data.success) {
        setCertificates(data.certificates);
        setBadges(data.badges);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certUrl: string, eventName: string) => {
    const a = document.createElement('a');
    a.href = certUrl;
    a.download = `Certificate-${eventName}-${Date.now()}`;
    a.click();
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate from ${certificate.event_name}`,
          text: `I earned a certificate from ${certificate.event_name}!`,
          url: certificate.certificate_url,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(certificate.certificate_url);
      alert('Link copied to clipboard!');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'volunteer':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: '🤝' };
      case 'participant':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: '🎯' };
      case 'winning':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: '🏆' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: '📜' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-3xl font-bold text-blue-600">{stats.totalCertificates}</p>
            <p className="text-sm text-blue-700">Total Certificates</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border border-cyan-200">
            <p className="text-3xl font-bold text-cyan-600">{stats.volunteer}</p>
            <p className="text-sm text-cyan-700">Volunteer</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <p className="text-3xl font-bold text-purple-600">{stats.participant}</p>
            <p className="text-sm text-purple-700">Participant</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <p className="text-3xl font-bold text-yellow-600">{stats.winning}</p>
            <p className="text-sm text-yellow-700">Winning</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
            <p className="text-3xl font-bold text-pink-600">{stats.totalBadges}</p>
            <p className="text-sm text-pink-700">Badges</p>
          </div>
        </div>
      )}

      {/* Badges Section */}
      {badges.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-4">🏅 Your Achievement Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg border-2 border-amber-300 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-2">✨</div>
                <p className="font-bold text-sm mb-1">{badge.badge_name}</p>
                <p className="text-xs text-gray-600">{badge.badge_description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">📜 Your Certificates</h3>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'volunteer', 'participant', 'winning'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">No certificates yet</p>
            <p className="text-sm text-gray-500">Participate in events to earn certificates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => {
              const style = getTypeColor(cert.certificate_type);
              return (
                <div
                  key={cert.id}
                  className={`${style.bg} border-2 ${style.border} rounded-lg overflow-hidden hover:shadow-lg transition-shadow`}
                >
                  {/* Certificate Preview */}
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={cert.certificate_url}
                      alt={`Certificate from ${cert.event_name}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedCert(cert)}
                    />
                  </div>

                  {/* Certificate Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{cert.event_name}</p>
                        <p className={`text-sm ${style.text} font-semibold`}>
                          {style.badge} {cert.certificate_type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {cert.certificate_title && (
                      <p className="text-sm text-gray-600 mb-2">{cert.certificate_title}</p>
                    )}

                    <p className="text-xs text-gray-500 mb-3">
                      Issued: {new Date(cert.sent_date).toLocaleDateString()}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(cert.certificate_url, cert.event_name)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleShare(cert)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="flex items-center justify-center py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Certificate Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCert(null)}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">{selectedCert.event_name}</h3>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <img
                src={selectedCert.certificate_url}
                alt={`Certificate from ${selectedCert.event_name}`}
                className="w-full h-auto rounded-lg border border-gray-200"
              />

              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Type:</strong> {selectedCert.certificate_type.toUpperCase()}
                </p>
                {selectedCert.certificate_title && (
                  <p>
                    <strong>Title:</strong> {selectedCert.certificate_title}
                  </p>
                )}
                <p>
                  <strong>Issued:</strong> {new Date(selectedCert.sent_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>By:</strong> {selectedCert.issued_by}
                </p>
              </div>

              <div className="mt-6 flex gap-2">
                <a
                  href={selectedCert.certificate_url}
                  download
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Download Certificate
                </a>
                <button
                  onClick={() => handleShare(selectedCert)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
