## IT & FM Support – API Endpoints

Design for IT Helpdesk and Facilities Management (FM) support pages to connect the frontend with the backend. Follows a shared ticket model with a `module` flag (`"it"` / `"fm"`).

---

### 1. Base Concepts

- **Modules**: IT vs FM, distinguished by `module` field or query param.
- **Ticket**: Core record for a support request (user or admin/staff view).
- **Comment**: User–staff conversation on a ticket.
- **Attachment**: Files or photos linked to a ticket.
- **Assignments & Status**: Admin/staff workflow.

---

### 2. Lookups & Metadata

#### 2.1 Support Categories

**GET** `/api/support/categories`

- **Description**: List support categories for IT and FM.
- **Query params**:
  - `module` (optional): `"it"` or `"fm"`. If omitted, return all or a default module.

- **Response example**:

```json
[
  { "id": 1, "module": "it", "name": "Network / Wi‑Fi" },
  { "id": 2, "module": "it", "name": "Hardware" },
  { "id": 10, "module": "fm", "name": "Cleaning" },
  { "id": 11, "module": "fm", "name": "Electrical" }
]
```

#### 2.2 Locations (for FM)

**GET** `/api/support/locations`

- **Description**: Buildings / rooms / areas for FM tickets.
- **Query params** (optional):
  - `buildingId`: filter rooms by building.

- **Response example**:

```json
{
  "buildings": [
    { "id": 1, "code": "main", "name": "Main Building" },
    { "id": 2, "code": "lib", "name": "Library" }
  ],
  "rooms": [
    { "id": 101, "buildingId": 1, "name": "B101" },
    { "id": 102, "buildingId": 1, "name": "B102" }
  ]
}
```

#### 2.3 Priorities

**GET** `/api/support/priorities`

- **Description**: Allowed priorities.

- **Response example**:

```json
[
  { "code": "Low", "label": "Low" },
  { "code": "Medium", "label": "Medium" },
  { "code": "High", "label": "High" },
  { "code": "Critical", "label": "Critical" }
]
```

---

### 3. Ticket Creation (IT & FM)

#### 3.1 Create Ticket

**POST** `/api/support/tickets`

- **Description**: Create a new IT or FM support ticket.
- **Auth**: Logged‑in user.
- **Body** (example – extend as needed):

```json
{
  "module": "it",
  "title": "Printer not working",
  "description": "The printer in B203 shows paper jam error.",
  "categoryId": 3,
  "priority": "High",
  "location": {
    "buildingId": 1,
    "room": "B203",
    "details": "Near main corridor"
  },
  "contactPhone": "0123456789"
}
```

- **Response**:

```json
{
  "id": 123,
  "reference": "SUP-000123",
  "module": "it",
  "title": "Printer not working",
  "status": "New",
  "priority": "High",
  "createdAt": "2026-03-14T10:20:00Z"
}
```

#### 3.2 Upload Attachments for a Ticket

**POST** `/api/support/tickets/:ticketId/attachments`

- **Description**: Upload one or more attachments (images, PDFs, etc.) for a ticket.
- **Auth**: Ticket owner or staff.
- **Request**: `multipart/form-data`
  - `files[]`: file(s) to upload.

- **Response**:

```json
[
  {
    "id": 1,
    "ticketId": 123,
    "fileName": "photo1.jpg",
    "url": "/uploads/support/123/photo1.jpg",
    "uploadedAt": "2026-03-14T10:21:00Z"
  }
]
```

---

### 4. User‑Side Tickets (“My Requests” Pages)

#### 4.1 List My Tickets

**GET** `/api/support/tickets`

- **Description**: List tickets created by the current user.
- **Auth**: Logged‑in user.
- **Query params** (all optional):
  - `module`: `"it"` or `"fm"`.
  - `status`: e.g. `"New"`, `"In Progress"`, `"Resolved"`, `"Closed"` or `"All"`.
  - `page`: page number for pagination.
  - `pageSize`: items per page.
  - `search`: free‑text search by title / reference.

- **Response**:

```json
{
  "items": [
    {
      "id": 123,
      "reference": "SUP-000123",
      "module": "it",
      "title": "Printer not working",
      "status": "In Progress",
      "priority": "High",
      "createdAt": "2026-03-14T10:20:00Z",
      "lastUpdatedAt": "2026-03-14T11:05:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 5
}
```

#### 4.2 Get Ticket Detail (User View)

**GET** `/api/support/tickets/:ticketId`

- **Description**: Ticket details visible to the requesting user.
- **Auth**: Ticket owner or staff.

- **Response** (example):

```json
{
  "id": 123,
  "reference": "SUP-000123",
  "module": "it",
  "title": "Printer not working",
  "description": "The printer in B203 shows paper jam error.",
  "category": { "id": 3, "name": "Hardware" },
  "priority": "High",
  "status": "In Progress",
  "createdAt": "2026-03-14T10:20:00Z",
  "updatedAt": "2026-03-14T11:05:00Z",
  "location": {
    "buildingId": 1,
    "buildingName": "Main Building",
    "room": "B203",
    "details": "Near main corridor"
  },
  "assignee": {
    "id": 42,
    "name": "Helpdesk Agent"
  }
}
```

#### 4.3 List Attachments (User View)

**GET** `/api/support/tickets/:ticketId/attachments`

- **Description**: List attachments for a ticket.

- **Response**:

```json
[
  {
    "id": 1,
    "fileName": "photo1.jpg",
    "url": "/uploads/support/123/photo1.jpg"
  }
]
```

#### 4.4 Comments / Conversation (User View)

**GET** `/api/support/tickets/:ticketId/comments`

- **Description**: Get public conversation thread for this ticket.

- **Response**:

```json
[
  {
    "id": 1,
    "authorType": "user",
    "authorName": "Student A",
    "message": "Here is more detail…",
    "createdAt": "2026-03-14T10:30:00Z"
  },
  {
    "id": 2,
    "authorType": "staff",
    "authorName": "Helpdesk Agent",
    "message": "We will check the printer today.",
    "createdAt": "2026-03-14T10:40:00Z"
  }
]
```

**POST** `/api/support/tickets/:ticketId/comments`

- **Description**: Add a new message from user or staff (public).

- **Body**:

```json
{
  "message": "Any update on this issue?"
}
```

- **Response**:

```json
{
  "id": 3,
  "ticketId": 123,
  "authorType": "user",
  "authorName": "Student A",
  "message": "Any update on this issue?",
  "createdAt": "2026-03-14T11:00:00Z"
}
```

#### 4.5 User Actions on Ticket

**PATCH** `/api/support/tickets/:ticketId`

- **Description**: Limited updates from the ticket owner (e.g., close or reopen the ticket, update contact info).
- **Body examples**:

_Close ticket:_

```json
{
  "action": "close"
}
```

_Reopen ticket:_

```json
{
  "action": "reopen"
}
```

_Update contact phone:_

```json
{
  "action": "update_contact",
  "contactPhone": "0987654321"
}
```

- **Response**:

```json
{
  "id": 123,
  "status": "Closed",
  "updatedAt": "2026-03-14T12:00:00Z"
}
```

---

### 5. Admin / Staff Endpoints (IT Helpdesk & FM Team)

All admin endpoints are under `/api/admin/support/...` and require staff/admin role.

#### 5.1 List Tickets (Admin/Staff)

**GET** `/api/admin/support/tickets`

- **Description**: Filterable list for admin dashboards (IT & FM).
- **Query params** (all optional):
  - `module`: `"it"` or `"fm"`.
  - `status`: e.g. `"New"`, `"In Progress"`, `"On Hold"`, `"Resolved"`, `"Closed"`.
  - `priority`: `"Low" | "Medium" | "High" | "Critical"`.
  - `assigneeId`: filter by current assignee.
  - `createdFrom`: ISO date/time.
  - `createdTo`: ISO date/time.
  - `search`: text search (title, reference, user name, email).
  - `page`, `pageSize`.

- **Response**:

```json
{
  "items": [
    {
      "id": 123,
      "reference": "SUP-000123",
      "module": "it",
      "title": "Printer not working",
      "requesterName": "Student A",
      "status": "In Progress",
      "priority": "High",
      "assignee": { "id": 42, "name": "Helpdesk Agent" },
      "createdAt": "2026-03-14T10:20:00Z",
      "updatedAt": "2026-03-14T11:05:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 120
}
```

#### 5.2 Get Ticket Detail (Admin/Staff)

**GET** `/api/admin/support/tickets/:ticketId`

- **Description**: Full detail for staff, including internal fields.

- **Response** (extra admin fields allowed, e.g. SLA info, internal notes flag):

```json
{
  "id": 123,
  "reference": "SUP-000123",
  "module": "it",
  "title": "Printer not working",
  "description": "The printer in B203 shows paper jam error.",
  "category": { "id": 3, "name": "Hardware" },
  "priority": "High",
  "status": "In Progress",
  "requester": {
    "id": 5,
    "name": "Student A",
    "email": "student@example.com"
  },
  "location": {
    "buildingId": 1,
    "buildingName": "Main Building",
    "room": "B203",
    "details": "Near main corridor"
  },
  "assignee": {
    "id": 42,
    "name": "Helpdesk Agent"
  },
  "createdAt": "2026-03-14T10:20:00Z",
  "updatedAt": "2026-03-14T11:05:00Z",
  "sla": {
    "dueAt": "2026-03-14T16:00:00Z",
    "breached": false
  }
}
```

#### 5.3 Change Ticket Status (Admin/Staff)

**PATCH** `/api/admin/support/tickets/:ticketId/status`

- **Description**: Update ticket lifecycle status and (optionally) set resolution.

- **Body**:

```json
{
  "status": "Resolved",
  "resolutionSummary": "Replaced toner and cleared paper jam."
}
```

- **Response**:

```json
{
  "id": 123,
  "status": "Resolved",
  "resolutionSummary": "Replaced toner and cleared paper jam.",
  "updatedAt": "2026-03-14T12:10:00Z"
}
```

#### 5.4 Assign / Reassign Ticket

**PATCH** `/api/admin/support/tickets/:ticketId/assign`

- **Description**: Assign a ticket to a staff member.

- **Body**:

```json
{
  "assigneeId": 42
}
```

- **Response**:

```json
{
  "id": 123,
  "assignee": {
    "id": 42,
    "name": "Helpdesk Agent"
  },
  "updatedAt": "2026-03-14T11:00:00Z"
}
```

#### 5.5 Internal Comments (Staff Only)

**GET** `/api/admin/support/tickets/:ticketId/internal-comments`

- **Description**: Internal notes thread visible only to staff.

- **Response**:

```json
[
  {
    "id": 1,
    "authorId": 42,
    "authorName": "Helpdesk Agent",
    "message": "Check if toner is empty. Likely recurring issue.",
    "createdAt": "2026-03-14T10:50:00Z"
  }
]
```

**POST** `/api/admin/support/tickets/:ticketId/internal-comments`

- **Body**:

```json
{
  "message": "Need to order replacement printer."
}
```

- **Response**:

```json
{
  "id": 2,
  "ticketId": 123,
  "authorId": 7,
  "authorName": "FM Manager",
  "message": "Need to order replacement printer.",
  "createdAt": "2026-03-14T11:10:00Z"
}
```

---

### 6. Scheduling (Mainly FM, Optional)

If the FM team schedules physical interventions (cleaning, repairs, etc.).

#### 6.1 Set / Update Visit Schedule

**PATCH** `/api/admin/support/tickets/:ticketId/schedule`

- **Description**: Set or update planned visit time and technician/team.

- **Body**:

```json
{
  "scheduledAt": "2026-03-15T09:00:00Z",
  "technicianId": 55,
  "notes": "Morning slot, access through back door."
}
```

- **Response**:

```json
{
  "id": 123,
  "scheduledAt": "2026-03-15T09:00:00Z",
  "technician": {
    "id": 55,
    "name": "FM Technician"
  },
  "updatedAt": "2026-03-14T11:30:00Z"
}
```

---

### 7. Feedback & Rating (Optional)

#### 7.1 Submit Feedback

**POST** `/api/support/tickets/:ticketId/feedback`

- **Description**: User feedback after a ticket is resolved/closed.

- **Body**:

```json
{
  "rating": 4,
  "comment": "Issue was resolved quickly, thanks!"
}
```

- **Response**:

```json
{
  "ticketId": 123,
  "rating": 4,
  "comment": "Issue was resolved quickly, thanks!",
  "submittedAt": "2026-03-14T13:00:00Z"
}
```

#### 7.2 Get Feedback (Admin)

**GET** `/api/admin/support/tickets/:ticketId/feedback`

- **Description**: View feedback associated with a ticket.

- **Response**:

```json
{
  "ticketId": 123,
  "rating": 4,
  "comment": "Issue was resolved quickly, thanks!",
  "submittedAt": "2026-03-14T13:00:00Z"
}
```

---

### 8. Analytics & Stats (Admin Dashboards)

#### 8.1 Summary Statistics

**GET** `/api/admin/support/stats`

- **Description**: KPIs for dashboard cards/charts.
- **Query params**:
  - `module`: `"it"` or `"fm"` or `"all"`.
  - `from`: start date (e.g. `2026-03-01`).
  - `to`: end date (e.g. `2026-03-31`).

- **Response**:

```json
{
  "module": "it",
  "from": "2026-03-01",
  "to": "2026-03-31",
  "totalTickets": 250,
  "openTickets": 40,
  "resolvedTickets": 200,
  "closedTickets": 180,
  "avgResolutionHours": 5.2,
  "byStatus": [
    { "status": "New", "count": 10 },
    { "status": "In Progress", "count": 30 },
    { "status": "Resolved", "count": 30 },
    { "status": "Closed", "count": 180 }
  ]
}
```

---

### 9. Mapping to Frontend Pages (Example)

You can adapt naming to your actual route names; below is conceptual:

- **IT Support – Submit Request page**
  - `GET /api/support/categories?module=it`
  - `GET /api/support/priorities`
  - `POST /api/support/tickets`
  - `POST /api/support/tickets/:ticketId/attachments`

- **FM Support – Submit Request page**
  - `GET /api/support/categories?module=fm`
  - `GET /api/support/locations`
  - `GET /api/support/priorities`
  - `POST /api/support/tickets`
  - `POST /api/support/tickets/:ticketId/attachments`

- **IT “My Requests” page**
  - `GET /api/support/tickets?module=it&...`
  - `GET /api/support/tickets/:ticketId`
  - `GET /api/support/tickets/:ticketId/comments`
  - `POST /api/support/tickets/:ticketId/comments`
  - `PATCH /api/support/tickets/:ticketId` (close/reopen)
  - `GET /api/support/tickets/:ticketId/attachments`
  - `POST /api/support/tickets/:ticketId/feedback` (optional)

- **FM “My Requests” page**
  - Same as IT, with `module=fm`.

- **IT Helpdesk Admin page**
  - `GET /api/admin/support/tickets?module=it&...`
  - `GET /api/admin/support/tickets/:ticketId`
  - `PATCH /api/admin/support/tickets/:ticketId/status`
  - `PATCH /api/admin/support/tickets/:ticketId/assign`
  - `GET /api/admin/support/tickets/:ticketId/internal-comments`
  - `POST /api/admin/support/tickets/:ticketId/internal-comments`
  - `GET /api/admin/support/stats?module=it&from=...&to=...`

- **FM Team Admin page**
  - Same pattern with `module=fm`, plus:
  - `PATCH /api/admin/support/tickets/:ticketId/schedule`
  - `GET /api/admin/support/stats?module=fm&from=...&to=...`

