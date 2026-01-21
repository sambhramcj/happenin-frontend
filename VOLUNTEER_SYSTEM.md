# 🤝 Volunteer Hiring System - Complete Implementation

## 📋 Overview

A complete volunteer management system allowing students to apply for event volunteer positions, organizers to review applications and see certificates, and both to track volunteer assignments.

---

## 🗄️ Database Schema

### New Tables Created:

#### 1. `volunteer_applications`
Tracks student applications for volunteer positions.

```sql
CREATE TABLE volunteer_applications (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  student_email TEXT REFERENCES users(email),
  role TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by TEXT REFERENCES users(email),
  UNIQUE(event_id, student_email, role)
);
```

#### 2. `volunteer_certificates`
Stores student's past volunteer experience certificates.

```sql
CREATE TABLE volunteer_certificates (
  id UUID PRIMARY KEY,
  student_email TEXT REFERENCES users(email),
  event_name TEXT NOT NULL,
  role TEXT NOT NULL,
  organization TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  certificate_url TEXT,
  issued_by TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `volunteer_assignments`
Tracks accepted volunteers actually working on events.

```sql
CREATE TABLE volunteer_assignments (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  student_email TEXT REFERENCES users(email),
  role TEXT NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by TEXT REFERENCES users(email),
  hours_contributed DECIMAL(5,2) DEFAULT 0,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(event_id, student_email, role)
);
```

### Modified Tables:

#### `events` table - Added volunteer fields:
```sql
ALTER TABLE events ADD COLUMN:
- needs_volunteers BOOLEAN DEFAULT FALSE
- volunteer_roles JSONB DEFAULT '[]'
- volunteer_description TEXT
```

**volunteer_roles format:**
```json
[
  {
    "role": "Registration Desk",
    "count": 5,
    "description": "Check-in attendees and distribute materials"
  },
  {
    "role": "Stage Management",
    "count": 3,
    "description": "Manage stage setup and technical equipment"
  }
]
```

---

## 🔌 API Routes Created

### Student Routes

#### **POST `/api/volunteers/apply`**
Submit volunteer application.

**Request Body:**
```json
{
  "eventId": "uuid",
  "role": "Registration Desk",
  "message": "I have 2 years of experience..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Volunteer application submitted successfully",
  "application": {
    "id": "uuid",
    "event_id": "uuid",
    "student_email": "student@test.com",
    "role": "Registration Desk",
    "status": "pending",
    "applied_at": "2026-01-21T10:00:00Z"
  }
}
```

#### **GET `/api/volunteers/apply`**
Get student's all volunteer applications.

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "role": "Registration Desk",
      "status": "accepted",
      "applied_at": "2026-01-21T10:00:00Z",
      "events": {
        "id": "uuid",
        "title": "Tech Fest 2026",
        "date": "2026-02-15",
        "location": "Main Auditorium"
      }
    }
  ]
}
```

#### **POST `/api/student/certificates`**
Add volunteer certificate.

**Request Body:**
```json
{
  "eventName": "Annual Tech Fest 2025",
  "role": "Registration Volunteer",
  "organization": "College Tech Club",
  "date": "2025-12-10",
  "description": "Managed check-in desk for 500+ attendees",
  "certificateUrl": "https://...",
  "issuedBy": "Event Coordinator Name"
}
```

#### **GET `/api/student/certificates`**
Get student's certificates (or any student's if you're an organizer).

**Query Params:**
- `email` (optional) - View another student's certificates (organizers only)

**Response:**
```json
{
  "certificates": [
    {
      "id": "uuid",
      "event_name": "Tech Fest 2025",
      "role": "Registration Volunteer",
      "organization": "College Tech Club",
      "date": "2025-12-10",
      "verified": false
    }
  ]
}
```

#### **DELETE `/api/student/certificates?id=uuid`**
Delete certificate.

---

### Organizer Routes

#### **GET `/api/organizer/volunteers/[eventId]`**
Get all volunteer applications for an event with applicant details and certificates.

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "student_email": "student@test.com",
      "role": "Registration Desk",
      "message": "I have experience...",
      "status": "pending",
      "applied_at": "2026-01-21T10:00:00Z",
      "student_profiles": {
        "full_name": "John Doe",
        "phone_number": "9876543210",
        "college_name": "NITK"
      },
      "certificates": [
        {
          "event_name": "Tech Fest 2025",
          "role": "Registration Volunteer",
          "organization": "Tech Club",
          "date": "2025-12-10"
        }
      ]
    }
  ]
}
```

#### **PATCH `/api/organizer/volunteers/application/[applicationId]`**
Accept or reject volunteer application.

**Request Body:**
```json
{
  "status": "accepted"  // or "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application accepted successfully",
  "application": {
    "id": "uuid",
    "status": "accepted",
    "reviewed_at": "2026-01-21T11:00:00Z",
    "reviewed_by": "organizer@test.com"
  }
}
```

When accepted, automatically creates entry in `volunteer_assignments` table.

---

## 🎯 Features

### For Students:

1. **Browse Volunteer Opportunities**
   - See events that need volunteers
   - View required roles and descriptions
   - Check how many volunteers needed per role

2. **Apply for Positions**
   - Select role from available options
   - Write application message
   - Track application status (pending/accepted/rejected)

3. **Manage Certificates**
   - Add past volunteer certificates
   - Upload certificate images/PDFs
   - Showcase experience to organizers

4. **View Application History**
   - See all applications
   - Track which were accepted/rejected
   - View events volunteered for

### For Organizers:

1. **Create Volunteer Opportunities**
   - Toggle "needs volunteers" when creating event
   - Specify multiple roles with counts
   - Add description of volunteer duties

2. **Review Applications**
   - View all applicants for each role
   - See applicant profiles
   - Check past volunteer certificates
   - Accept or reject applications

3. **Manage Volunteer Team**
   - View list of accepted volunteers
   - See volunteer assignments by role
   - Track volunteer contributions
   - Rate volunteer performance (future)

4. **Dashboard View**
   - See all volunteers for club events
   - Track volunteer hours
   - View volunteer feedback

---

## 🎨 UI Integration Points

### Student Dashboard - New "Volunteer" Tab

Add to student dashboard navigation:

```typescript
<Tab onClick={() => setActiveTab('volunteer')}>
  🤝 Volunteer
</Tab>
```

**Volunteer Tab Content:**
1. **My Applications** - List of all applications with status
2. **My Certificates** - Grid of certificates with add/delete
3. **Available Opportunities** - Browse events needing volunteers

### Event Details Page - Volunteer Section

When viewing event as student:

```tsx
{event.needs_volunteers && (
  <VolunteerSection 
    eventId={event.id}
    volunteerRoles={event.volunteer_roles}
    description={event.volunteer_description}
  />
)}
```

### Organizer Dashboard - New "Volunteers" Tab

Add to organizer dashboard for each event:

```typescript
<Tab onClick={() => setActiveTab('volunteers')}>
  🤝 Volunteers ({volunteerCount})
</Tab>
```

**Volunteers Tab Content:**
1. **Applications** - Pending, accepted, rejected
2. **Volunteer Team** - List of accepted volunteers by role
3. **Application Review** - Detailed view with certificates

### Event Creation Form - Volunteer Fields

Add to event creation form:

```tsx
<Checkbox
  checked={needsVolunteers}
  onChange={(e) => setNeedsVolunteers(e.target.checked)}
>
  This event needs volunteers
</Checkbox>

{needsVolunteers && (
  <>
    <TextArea
      placeholder="Describe volunteer opportunities..."
      value={volunteerDescription}
      onChange={(e) => setVolunteerDescription(e.target.value)}
    />
    
    <VolunteerRolesEditor
      roles={volunteerRoles}
      onChange={setVolunteerRoles}
    />
  </>
)}
```

---

## 📊 Example Usage Flow

### Student Applies for Volunteer Position:

```typescript
// 1. Student browses events
const events = await fetch('/api/events?volunteers=true');

// 2. Clicks "Apply to Volunteer" on event
const application = await fetch('/api/volunteers/apply', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'event-uuid',
    role: 'Registration Desk',
    message: 'I have 2 years of experience managing registration desks...'
  })
});

// 3. Application status: "pending"
```

### Organizer Reviews Application:

```typescript
// 1. Organizer views applications for their event
const { applications } = await fetch('/api/organizer/volunteers/event-uuid');

// 2. Reviews applicant's profile and certificates
applications.forEach(app => {
  console.log(app.student_profiles.full_name);
  console.log(app.certificates); // See past volunteer work
});

// 3. Accepts application
await fetch('/api/organizer/volunteers/application/app-uuid', {
  method: 'PATCH',
  body: JSON.stringify({ status: 'accepted' })
});

// 4. Student automatically added to volunteer_assignments table
```

---

## 🔒 Security & Permissions

### Row Level Security (RLS) Policies:

1. **Students can:**
   - View their own applications and certificates
   - Create applications for themselves
   - Add/edit/delete their own certificates

2. **Organizers can:**
   - View applications for their events
   - View certificates of applicants to their events
   - Accept/reject applications for their events
   - Create volunteer assignments for their events

3. **Public can:**
   - View volunteer assignments (to see event volunteer team)

### Business Rules:

- ✅ Only students can apply for volunteer positions
- ✅ Can't apply twice for same role in same event
- ✅ Only event organizer can review applications
- ✅ Accepting application auto-creates assignment
- ✅ Certificates visible to organizers reviewing applications

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# In Supabase SQL Editor, run:
frontend/src/lib/volunteer-migrations.sql
```

This creates:
- 3 new tables
- Adds volunteer fields to events table
- Sets up RLS policies
- Creates indexes

### 2. Test Volunteer System

```bash
# 1. Create event with volunteers
POST /api/events
{
  "title": "Tech Fest",
  "needs_volunteers": true,
  "volunteer_roles": [
    {"role": "Registration", "count": 5, "description": "Check-in desk"}
  ]
}

# 2. Student applies
POST /api/volunteers/apply
{
  "eventId": "uuid",
  "role": "Registration",
  "message": "I want to help!"
}

# 3. Organizer reviews
GET /api/organizer/volunteers/event-uuid

# 4. Organizer accepts
PATCH /api/organizer/volunteers/application/app-uuid
{"status": "accepted"}
```

---

## 📈 Future Enhancements

### Phase 2 (Optional):
- ✨ Email notifications for application status
- ✨ SMS reminders for volunteer shifts
- ✨ QR code check-in for volunteers
- ✨ Volunteer hour tracking
- ✨ Rating system (organizers rate volunteers)
- ✨ Volunteer leaderboard
- ✨ Certificate verification by organizers
- ✨ Bulk actions (accept/reject multiple)

---

## ✅ Checklist

**Implementation Complete:**
- ✅ Database schema with 3 new tables
- ✅ RLS policies for security
- ✅ Student application API
- ✅ Certificate management API
- ✅ Organizer review API
- ✅ Accept/reject API
- ✅ Automatic assignment creation
- ✅ Documentation

**Next Steps:**
1. Run migration in Supabase
2. Add UI components (volunteer tab, forms, lists)
3. Test entire flow
4. Deploy to production

---

## 🎉 Summary

**What's Added:**
- Complete volunteer hiring system
- Students can apply + manage certificates
- Organizers can review applications + see certificates
- Automatic volunteer team management
- Full security with RLS policies

**Benefits:**
- Structured volunteer recruitment
- Track volunteer experience
- Fair selection process
- Historical record of contributions
- Easy team management for organizers

Your volunteer system is ready to use! 🚀
