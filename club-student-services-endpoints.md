# Club, Club Admin, and Student Services API Contract

This document lists the backend endpoints needed by:
- Club-related student pages
- Club admin pages
- Student Services pages

---

## 1) Club Pages (Student Side)

### Clubs / Membership / Proposals

### `GET /api/clubs?search=&category=&page=&limit=`
**Response**
```json
{
  "items": [
    {
      "id": 1,
      "name": "ADA Digital Entertainment Club",
      "category": "Technology",
      "image": "/clubs/digital.png",
      "tags": ["Gaming", "Digital Media"],
      "members": 156,
      "about": "Club description...",
      "status": "Open"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 12
}
```

### `GET /api/clubs/:clubId`
**Response**
```json
{
  "id": 1,
  "name": "ADA Digital Entertainment Club",
  "category": "Technology",
  "about": "Club mission...",
  "focusAreas": [{ "title": "Esports", "description": "..." }],
  "officers": [{ "name": "Rashad", "role": "President" }],
  "memberProfiles": [{ "name": "Jane", "role": "Member", "department": "CS" }],
  "announcements": [{ "title": "Meeting", "message": "...", "date": "2026-04-06" }],
  "email": "club@ada.edu.az",
  "website": "https://...",
  "instagram": "https://instagram.com/...",
  "x": "https://x.com/...",
  "tiktok": "https://tiktok.com/@..."
}
```

### `GET /api/clubs/:clubId/members`
**Response**
```json
{
  "items": [
    { "id": "m1", "name": "Jane", "role": "Member", "department": "CS" }
  ]
}
```

### `GET /api/me/club-memberships`
**Response**
```json
{
  "items": [
    {
      "clubId": 1,
      "clubName": "ADA Digital Entertainment Club",
      "memberSince": "2024-09",
      "role": "Member",
      "status": "Active"
    }
  ]
}
```

### `POST /api/clubs/:clubId/join-applications`
**Request** (`multipart/form-data`)
- `letterOfPurpose` (string, required)
- `portfolioLinks` (string, optional)
- `portfolioFiles[]` (file[], optional)

**Response**
```json
{
  "applicationId": "MEM-001",
  "status": "Submitted",
  "submittedAt": "2026-04-08T12:00:00Z"
}
```

### `POST /api/club-proposals`
**Request** (`multipart/form-data`)
- Club fundamentals, leadership, alignment/vision/commitment
- `logoFile` (image)
- `constitutionFile` (pdf)

**Response**
```json
{
  "proposalId": "PROP-2026-001",
  "status": "pending_review"
}
```

---

### Vacancies / Applications / Interviews

### `GET /api/vacancies?search=&category=&savedOnly=&page=&limit=`
### `GET /api/vacancies/:vacancyId`

### `GET /api/me/saved-vacancies`
### `POST /api/me/saved-vacancies/:vacancyId`
### `DELETE /api/me/saved-vacancies/:vacancyId`

### `POST /api/vacancies/:vacancyId/applications`
**Request** (`multipart/form-data`)
- `purposeOfApplication` (string, required)
- `cvFile` (file, required)

**Response**
```json
{
  "applicationId": "APP-123",
  "status": "Submitted"
}
```

### `GET /api/me/vacancy-applications`
### `GET /api/me/membership-applications`

### `GET /api/applications/:applicationId/interview-slots`
### `POST /api/applications/:applicationId/interview-slot`
**Request**
```json
{ "slotId": "SLOT-3" }
```
**Response**
```json
{
  "applicationId": "APP-123",
  "status": "Interview Scheduled",
  "interviewSlotId": "SLOT-3"
}
```

---

### Events / Registration / Tickets / Notifications

### `GET /api/events?clubId=&myClubsOnly=&search=&page=&limit=`
### `GET /api/events/:eventId`

### `POST /api/events/:eventId/registrations`
**Response**
```json
{
  "registrationId": "REG-1",
  "ticketId": "TC-2024-0001",
  "qrToken": "signed-token"
}
```

### `DELETE /api/events/:eventId/registrations`
### `GET /api/me/event-registrations`

### `GET /api/events/:eventId/ticket`
**Response**
```json
{
  "ticketId": "TC-2024-0001",
  "eventId": 1,
  "attendeeName": "Alex Johnson",
  "qrData": "..."
}
```

### `GET /api/me/club-notifications?type=all|proposals|membership|vacancies|events`
### `PATCH /api/me/club-notifications/:notificationId/read`

---

## 2) Club Admin Pages

### Dashboard / Activity
### `GET /api/club-admin/:clubId/dashboard`
**Response**
```json
{
  "stats": {
    "activeMembers": 124,
    "openVacancies": 3,
    "newApplications": 12,
    "upcomingEvents": 4
  },
  "activity": [
    {
      "id": 1,
      "studentName": "Alex Johnson",
      "actionType": "Application Submitted",
      "roleOrEvent": "Lead Designer",
      "status": "Pending Review",
      "timestamp": "2 mins ago"
    }
  ]
}
```

---

### Applications + Detail + Decisions

### `GET /api/club-admin/:clubId/applications?type=membership|job&status=&role=&search=&page=&limit=`
### `GET /api/club-admin/:clubId/applications/:applicationId`

### `POST /api/club-admin/:clubId/applications/:applicationId/approve`
### `POST /api/club-admin/:clubId/applications/:applicationId/reject`
**Request**
```json
{ "reason": "Not enough relevant experience" }
```

### `POST /api/club-admin/:clubId/applications/:applicationId/request-changes`
**Request**
```json
{ "changes": "Please clarify portfolio and update CV." }
```

### `POST /api/club-admin/:clubId/applications/:applicationId/notes`
**Request**
```json
{ "note": "Strong communication in interview." }
```

### `POST /api/club-admin/:clubId/applications/bulk-decision`
**Request**
```json
{
  "applicationIds": [1, 2, 3],
  "decision": "approve",
  "reason": ""
}
```

---

### Interview Times

### `GET /api/club-admin/:clubId/interview-slots?vacancy=...`

### `POST /api/club-admin/:clubId/interview-slots/generate`
**Request**
```json
{
  "date": "2026-04-20",
  "startTime": "15:00",
  "endTime": "17:00",
  "interviewLength": 20,
  "vacancy": "Marketing Coordinator"
}
```

### `PATCH /api/club-admin/:clubId/interview-slots/:slotId`
### `DELETE /api/club-admin/:clubId/interview-slots/:slotId`
### `POST /api/club-admin/:clubId/interview-slots/bulk-assign-vacancy`

---

### Vacancies + Positions

### `GET /api/club-admin/:clubId/vacancies`
### `POST /api/club-admin/:clubId/vacancies`
### `PATCH /api/club-admin/:clubId/vacancies/:vacancyId`
### `PATCH /api/club-admin/:clubId/vacancies/:vacancyId/status`

### `GET /api/club-admin/:clubId/positions`
### `POST /api/club-admin/:clubId/positions`
### `PATCH /api/club-admin/:clubId/positions/:positionId`
### `DELETE /api/club-admin/:clubId/positions/:positionId`

---

### Members / Employees

### `GET /api/club-admin/:clubId/members`
### `DELETE /api/club-admin/:clubId/members/:memberId`

### `GET /api/club-admin/:clubId/employees`
### `POST /api/club-admin/:clubId/employees`
**Request**
```json
{
  "studentId": "20230123",
  "position": "Event Coordinator"
}
```

### `PATCH /api/club-admin/:clubId/employees/positions`
**Request**
```json
{
  "changes": [
    { "id": 7, "position": "President" }
  ]
}
```

### `DELETE /api/club-admin/:clubId/employees/:employeeId`

---

### Club Admin Events

### `GET /api/club-admin/:clubId/events?status=all|upcoming|past&search=`
### `PATCH /api/club-admin/:clubId/events/:eventId`
### `POST /api/club-admin/:clubId/events/proposals`

### `GET /api/club-admin/:clubId/events/:eventId/attendees`
### `PATCH /api/club-admin/:clubId/events/:eventId/attendees/:attendeeId`
**Request**
```json
{ "entered": true }
```
### `DELETE /api/club-admin/:clubId/events/:eventId/attendees/:attendeeId`

---

### Club Profile + Announcements

### `PATCH /api/club-admin/:clubId/profile`
**Request** (`multipart/form-data`)
- social links
- focus areas array
- logo/background files

### `POST /api/club-admin/:clubId/announcements`
**Request**
```json
{
  "title": "Weekly Meeting Update",
  "message": "Meetings are now on Wednesdays 18:00."
}
```

---

## 3) Student Services + Its Related Pages

### Command Center / Master Directory

### `GET /api/student-services/dashboard`
### `GET /api/student-services/clubs?search=&page=&limit=`
### `GET /api/student-services/clubs/:clubId`

---

### Club Proposal Review

### `GET /api/student-services/club-proposals?status=pending_review|under_revision&search=`
### `GET /api/student-services/club-proposals/:proposalId`

### `POST /api/student-services/club-proposals/:proposalId/approve`
### `POST /api/student-services/club-proposals/:proposalId/reject`
**Request**
```json
{ "reason": "Missing required constitution details." }
```

### `POST /api/student-services/club-proposals/:proposalId/request-revision`
**Request**
```json
{ "changes": "Clarify uniqueness and update officer IDs." }
```

### `GET /api/student-services/club-proposal-requirements`
### `PUT /api/student-services/club-proposal-requirements`
**Request**
```json
{
  "requirements": [
    "Minimum of 10 active student members",
    "Signed faculty advisor agreement form"
  ],
  "deadline": "2026-05-01"
}
```

---

### Event Proposal Review

### `GET /api/student-services/event-proposals?search=&status=`
### `GET /api/student-services/event-proposals/:proposalId`

### `POST /api/student-services/event-proposals/:proposalId/approve`
**Request**
```json
{
  "assignments": [
    { "subEventIndex": 0, "buildingId": "b1", "roomId": "r1" }
  ]
}
```

### `POST /api/student-services/event-proposals/:proposalId/reject`
### `POST /api/student-services/event-proposals/:proposalId/request-revision`

---

### Approved Events Management (Student Services Events section)

### `GET /api/student-services/events?status=all|upcoming|past&search=`
### `POST /api/student-services/events`
### `PATCH /api/student-services/events/:eventId`
### `GET /api/student-services/events/:eventId`
### `DELETE /api/student-services/events/:eventId` (optional)

---

### Student Services Club Management Actions

### `PATCH /api/student-services/clubs/:clubId`
**Request**
```json
{
  "name": "Modern Arts Society",
  "status": "Active"
}
```

### `POST /api/student-services/clubs/:clubId/profile-image/approve`

### `GET /api/student-services/clubs/:clubId/members`
### `PATCH /api/student-services/clubs/:clubId/members/:memberId`
### `DELETE /api/student-services/clubs/:clubId/members/:memberId`

### `GET /api/student-services/clubs/:clubId/employees`
### `POST /api/student-services/clubs/:clubId/employees`
### `PATCH /api/student-services/clubs/:clubId/employees/:employeeId`
### `DELETE /api/student-services/clubs/:clubId/employees/:employeeId`

---

## Notes
- Many current frontend actions are local/mock; these endpoints are the backend equivalents required for production behavior.
- File uploads should use `multipart/form-data`.
- All endpoints should be auth-protected and role-checked (`student`, `club_admin`, `student_services_admin`).

