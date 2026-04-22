# Web App Dev Prompt — Event Registration, Tickets, and Entrance Scanning

This prompt defines the **frontend requirements** for:

- event registration
- a **Tickets** section (shows all tickets for the current user)
- a **Scan** flow for club employees (pick club event → scan QR at entrance → check-in)

All endpoints are **authenticated** with:

- `Authorization: Bearer <access_token>`

Backend identifies user by JWT claim `sub` (or `user_id` fallback).

---

## 1) Student flow — Register + Ticket QR

### 1.1 Register for an event

Call:

- **POST** `/api/v1/events/{eventId}/registrations`
- Alias (also supported): **POST** `/api/events/{eventId}/registrations`

Expected behavior:

- If event is **full** → backend returns **HTTP 409**
- If user is **already registered** → backend returns the **existing ticket** (same `ticketId`, same `jwt`)

Response (AutoWrapper `result` / `data` is unwrapped in the frontend):

```json
{
  "ticketId": "TCK-...",
  "eventId": "42",
  "userId": "<currentUserId>",
  "jwt": "<ticketJwt>",
  "event": {
    "id": "42",
    "name": "AI Workshop",
    "imageUrl": "https://.../events/42/cover.png",
    "seatLimit": 150,
    "registeredCount": 120
  }
}
```

Frontend requirements:

- **Disable** the “Register” button when `registeredCount >= seatLimit`
- After successful register:
  - navigate to the ticket screen (e.g. `/clubs/events/{eventId}/ticket`)
  - pass the returned registration payload in navigation state (optional optimization)

### 1.2 Ticket screen (QR generation)

Call (when ticket screen opens or refreshes):

- **GET** `/api/v1/events/{eventId}/ticket`
- Alias: **GET** `/api/events/{eventId}/ticket`

Response includes the stable `jwt` for the ticket.

**QR content rule (important):**

- The QR code must encode **only the JWT string** returned by backend: `value = ticket.jwt`
- Do **not** encode custom JSON; scanner sends `jwt` to backend for validation.

---

## 2) Tickets section — “My Tickets”

Create a **Tickets** page/section in the UI:

- shows **all tickets** belonging to the current user
- each item displays at least:
  - event title/name
  - event time range (start/end)
  - location
  - event image/cover
  - a “View Ticket” button to open `/events/{eventId}/ticket`

### 2.1 Load tickets list

Call:

- **GET** `/api/v1/users/me/event-registrations`
- Alias: **GET** `/api/users/me/event-registrations`

Response:

```json
{
  "items": [
    {
      "eventId": "42",
      "ticketId": "TCK-...",
      "registeredAt": "2026-04-22T10:15:00Z",
      "event": {
        "id": "42",
        "name": "AI Workshop",
        "imageUrl": "https://.../events/42/cover.png",
        "startTime": "10:00",
        "endTime": "12:00",
        "location": "Room 302",
        "seatLimit": 150,
        "registeredCount": 120
      }
    }
  ]
}
```

Frontend requirements:

- Render cards **from the snapshot** `item.event.*` (especially `imageUrl`) to avoid refetching event detail.
- If any snapshots are missing (older backend), you may fall back to `GET /events/{eventId}`.

---

## 3) Club employee flow — Entrance scanning

If the signed-in user is an **employee of any club**, the Tickets page (or a dedicated “Scanner” page) must show a **Scan** button.

### 3.1 Role / eligibility logic

UI rule:

- Show **Scan** only if user has at least one “club employee” assignment.

Notes:

- If backend provides an endpoint for “my employee clubs”, use it.
- If not, derive it from existing club membership/employee lists available in your project.

### 3.2 Scan button → pick an event

When user presses **Scan**:

- show a list of clubs they are employee of
- after picking a club, show a list of that club’s upcoming events
- user selects the event they are scanning at the entrance

Event list data source (choose the best available):

- `GET /api/v1/club-admin/{clubId}/events` (if the user is a club employee/admin)
- or `GET /api/v1/events?clubId={clubId}` (general events listing)

### 3.3 QR scanning UI

After selecting the event:

- open a camera QR scanner view
- scanner reads the QR → produces the `jwt` string
- send it to backend check-in endpoint

### 3.4 Check-in endpoint (staff scan validation)

Call:

- **POST** `/api/v1/events/{eventId}/check-in`
- Alias: **POST** `/api/events/{eventId}/check-in`

Request body:

```json
{ "jwt": "<scannedTicketJwt>" }
```

Expected backend behavior:

- verifies JWT signature + expiry
- verifies route `{eventId}` matches JWT claim `eventId`
- looks up ticket/registration in DB
- enforces check-in window (e.g. 1 hour before start until event end)
- first scan → marks checked in
- subsequent scans → returns `already_checked_in`

Additional response requirement (attendee identity):

- On a successful scan (and also on `already_checked_in`), backend should return enough attendee identity info so the scanner UI can display:
  - **studentId** (or university id)
  - **name**
  - **surname**

Example response fields (recommended):

```json
{
  "success": true,
  "status": "checked_in",
  "message": "Entry allowed",
  "eventId": "42",
  "ticketId": "TCK-...",
  "attendee": {
    "userId": "9b2f...",
    "studentId": "202012345",
    "name": "Ali",
    "surname": "Mammadov"
  }
}
```

Frontend requirements:

- Show clear success/failure state for each scan:
  - **checked_in** → “Entry allowed”
  - **already_checked_in** → “Ticket already used”
  - **invalid/expired/not found/outside window** → show backend message
- Under the success/duplicate-scan message, display the attendee identity:
  - `name surname`
  - `studentId`
- Keep scanning enabled for the next attendee (fast workflow)

---

## 4) UX rules

- **Disable Register when full**: `registeredCount >= seatLimit`
- **Disable Register when already registered** (replace with “View Ticket”)
- Tickets page should be fast: prefer the `/users/me/event-registrations` snapshot list.
- Scanning flow must be **minimal taps**:
  - Scan → choose club → choose event → scan loop (continuous)

