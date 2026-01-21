# 📜 Unified Certificates System

## Overview

Students can view and manage ALL their certificates in one place - volunteering, participation, and winning certificates. The system supports filtering and categorization for easy access.

---

## Certificate Types

### 1. **Volunteering Certificates** 🤝
- **When**: Given for volunteer work at events
- **Fields**: Role, organization, date, description, certificate URL
- **Example**: "Registration Desk Volunteer at Tech Fest 2025"

### 2. **Participation Certificates** 🎯
- **When**: Given for attending/participating in events
- **Fields**: Event name, organization, date, description, certificate URL
- **Example**: "Participated in AI Workshop 2025"

### 3. **Winning Certificates** 🏆
- **When**: Given for winning competitions/awards
- **Fields**: Event name, organization, date, achievement, certificate URL
- **Example**: "1st Place in Hackathon 2025"

---

## Database Schema

### Updated `volunteer_certificates` Table

```sql
CREATE TABLE volunteer_certificates (
  id UUID PRIMARY KEY,
  student_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('volunteering', 'participation', 'winning')),
  event_name TEXT NOT NULL,
  role TEXT,                    -- Only for volunteering
  organization TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  certificate_url TEXT,
  issued_by TEXT,
  achievement TEXT,             -- Only for winning (e.g., "1st Place", "Gold Medal")
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_volunteer_certificates_student ON volunteer_certificates(student_email);
CREATE INDEX idx_volunteer_certificates_type ON volunteer_certificates(type);
CREATE INDEX idx_volunteer_certificates_date ON volunteer_certificates(date DESC);
```

---

## API Endpoints

### 📤 **POST /api/student/certificates**
Add a new certificate (any type)

**Request Body:**
```json
{
  "type": "volunteering",           // Required: 'volunteering' | 'participation' | 'winning'
  "eventName": "Tech Fest 2025",    // Required
  "organization": "Tech Club",      // Required
  "date": "2025-01-15",            // Required (YYYY-MM-DD)
  
  // Optional fields (depending on type)
  "role": "Registration Desk",      // For volunteering
  "achievement": "1st Place",       // For winning
  "description": "Helped with registration",
  "certificateUrl": "https://...",
  "issuedBy": "Dr. Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate added successfully",
  "certificate": {
    "id": "uuid",
    "type": "volunteering",
    "event_name": "Tech Fest 2025",
    "role": "Registration Desk",
    "organization": "Tech Club",
    "date": "2025-01-15",
    "verified": false,
    "created_at": "2025-01-21T..."
  }
}
```

---

### 📥 **GET /api/student/certificates**
Get all certificates with filtering

**Query Parameters:**
- `type` (optional): Filter by type - `'volunteering'`, `'participation'`, `'winning'`, or `'all'` (default)
- `email` (optional): For organizers to view applicant certificates

**Examples:**
```
GET /api/student/certificates                    // All certificates
GET /api/student/certificates?type=volunteering  // Only volunteering
GET /api/student/certificates?type=winning       // Only winning
GET /api/student/certificates?type=all           // All certificates
```

**Response:**
```json
{
  "certificates": [...],           // Filtered list based on 'type' parameter
  "grouped": {
    "all": [...],                  // All certificates
    "volunteering": [...],         // Only volunteering
    "participation": [...],        // Only participation
    "winning": [...]               // Only winning
  },
  "counts": {
    "total": 15,
    "volunteering": 5,
    "participation": 7,
    "winning": 3
  }
}
```

---

### 🗑️ **DELETE /api/student/certificates**
Delete a certificate

**Request Body:**
```json
{
  "certificateId": "uuid"
}
```

---

## Frontend Usage

### Display All Certificates with Tabs

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'volunteering' | 'participation' | 'winning'>('all');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    const response = await fetch('/api/student/certificates');
    const result = await response.json();
    setData(result);
  };

  const currentCertificates = data?.grouped[activeTab] || [];

  return (
    <div>
      <h1>My Certificates ({data?.counts.total || 0})</h1>
      
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' ? 'active' : ''}
        >
          All ({data?.counts.total || 0})
        </button>
        <button
          onClick={() => setActiveTab('volunteering')}
          className={activeTab === 'volunteering' ? 'active' : ''}
        >
          🤝 Volunteering ({data?.counts.volunteering || 0})
        </button>
        <button
          onClick={() => setActiveTab('participation')}
          className={activeTab === 'participation' ? 'active' : ''}
        >
          🎯 Participation ({data?.counts.participation || 0})
        </button>
        <button
          onClick={() => setActiveTab('winning')}
          className={activeTab === 'winning' ? 'active' : ''}
        >
          🏆 Winning ({data?.counts.winning || 0})
        </button>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentCertificates.map((cert: any) => (
          <CertificateCard key={cert.id} certificate={cert} />
        ))}
      </div>
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: any }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'volunteering': return '🤝';
      case 'participation': return '🎯';
      case 'winning': return '🏆';
      default: return '📜';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{getTypeIcon(certificate.type)}</span>
        <span className="text-sm font-medium text-gray-500 uppercase">
          {certificate.type}
        </span>
      </div>
      
      <h3 className="font-bold text-lg mb-1">{certificate.event_name}</h3>
      
      {certificate.type === 'volunteering' && certificate.role && (
        <p className="text-sm text-gray-600">Role: {certificate.role}</p>
      )}
      
      {certificate.type === 'winning' && certificate.achievement && (
        <p className="text-sm font-semibold text-yellow-600">
          {certificate.achievement}
        </p>
      )}
      
      <p className="text-sm text-gray-500 mb-2">{certificate.organization}</p>
      <p className="text-xs text-gray-400">{new Date(certificate.date).toLocaleDateString()}</p>
      
      {certificate.verified && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-2 inline-block">
          ✓ Verified
        </span>
      )}
      
      {certificate.certificate_url && (
        <a
          href={certificate.certificate_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 text-sm mt-2 block hover:underline"
        >
          View Certificate →
        </a>
      )}
    </div>
  );
}
```

---

### Add Certificate Form

```typescript
'use client';

import { useState } from 'react';

export default function AddCertificateForm({ onSuccess }: { onSuccess: () => void }) {
  const [type, setType] = useState<'volunteering' | 'participation' | 'winning'>('volunteering');
  const [formData, setFormData] = useState({
    eventName: '',
    organization: '',
    date: '',
    role: '',
    achievement: '',
    description: '',
    certificateUrl: '',
    issuedBy: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      type,
      eventName: formData.eventName,
      organization: formData.organization,
      date: formData.date,
      description: formData.description,
      certificateUrl: formData.certificateUrl,
      issuedBy: formData.issuedBy,
      ...(type === 'volunteering' && { role: formData.role }),
      ...(type === 'winning' && { achievement: formData.achievement }),
    };

    const response = await fetch('/api/student/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      onSuccess();
      // Reset form
      setFormData({
        eventName: '',
        organization: '',
        date: '',
        role: '',
        achievement: '',
        description: '',
        certificateUrl: '',
        issuedBy: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Certificate Type *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="volunteering">🤝 Volunteering</option>
          <option value="participation">🎯 Participation</option>
          <option value="winning">🏆 Winning</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Event Name *</label>
        <input
          type="text"
          value={formData.eventName}
          onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      {type === 'volunteering' && (
        <div>
          <label className="block text-sm font-medium mb-2">Role *</label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Registration Desk"
            required
          />
        </div>
      )}

      {type === 'winning' && (
        <div>
          <label className="block text-sm font-medium mb-2">Achievement *</label>
          <input
            type="text"
            value={formData.achievement}
            onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., 1st Place, Gold Medal"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Organization *</label>
        <input
          type="text"
          value={formData.organization}
          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Tech Club, IEEE"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Date *</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Additional details about this certificate"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Certificate URL</label>
        <input
          type="url"
          value={formData.certificateUrl}
          onChange={(e) => setFormData({ ...formData, certificateUrl: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Issued By</label>
        <input
          type="text"
          value={formData.issuedBy}
          onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Dr. Smith, Event Director"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Add Certificate
      </button>
    </form>
  );
}
```

---

## Student Dashboard Integration

Add a "Certificates" tab/section to the student dashboard:

```typescript
// In src/app/dashboard/student/page.tsx

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <nav className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('events')}>My Events</button>
        <button onClick={() => setActiveTab('certificates')}>📜 Certificates</button>
        <button onClick={() => setActiveTab('volunteer')}>🤝 Volunteer</button>
      </nav>

      {activeTab === 'certificates' && <CertificatesPage />}
      {/* Other tabs... */}
    </div>
  );
}
```

---

## Features Summary

### For Students
✅ **Unified View**: See all certificates in one place  
✅ **Filter by Type**: Quick tabs to filter by volunteering, participation, winning  
✅ **Visual Indicators**: Icons and badges for each certificate type  
✅ **Certificate Counts**: See total count for each category  
✅ **Easy Management**: Add, view, and delete certificates  
✅ **Verification Status**: See which certificates are verified  
✅ **Document Links**: Access certificate PDFs/images directly  

### For Organizers
✅ **View Applicant History**: See all certificates when reviewing volunteer applications  
✅ **Verification**: Mark certificates as verified  
✅ **Comprehensive Profile**: Understand student's full experience (volunteering + participation + wins)  

---

## Next Steps

1. **Run Updated Migration**: Execute the updated `volunteer-migrations.sql` in Supabase
2. **Add UI Components**: Create the certificates page with tabs and filters
3. **Test Flow**:
   - Student adds volunteering certificate
   - Student adds participation certificate
   - Student adds winning certificate
   - View all certificates with filtering
   - Organizer views student's certificates during volunteer review
4. **Auto-generate Certificates**: Optionally auto-create certificates when:
   - Student attends event (participation certificate)
   - Student completes volunteer work (volunteering certificate)
   - Student wins competition (winning certificate)

---

## Migration Notes

If you already ran the volunteer migration, run this ALTER statement to update the existing table:

```sql
-- Add type field to existing table
ALTER TABLE volunteer_certificates 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'volunteering' 
CHECK (type IN ('volunteering', 'participation', 'winning'));

-- Make role nullable (not required for participation/winning)
ALTER TABLE volunteer_certificates ALTER COLUMN role DROP NOT NULL;

-- Add achievement field for winning certificates
ALTER TABLE volunteer_certificates 
ADD COLUMN IF NOT EXISTS achievement TEXT;

-- Add index for filtering by type
CREATE INDEX IF NOT EXISTS idx_volunteer_certificates_type 
ON volunteer_certificates(type);
```
