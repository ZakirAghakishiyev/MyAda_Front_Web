# Support (Dispatcher + Staff) — Mobile Developer Documentation

This document describes the **frontend logic**, **status/workflow rules**, and the **backend endpoints** used by the Support module, specifically for:

- **Member (requester)**: creates tickets, tracks “My Requests”, can cancel, can call assigned staff.
- **Dispatcher**: monitors open tickets, assigns/reassigns staff, adds internal instructions, reviews history.
- **Support Staff**: sees assigned jobs only, marks progress, completes tickets, calls the ticket creator (teacher-only).

Source of truth in this repo:

- Pages: `src/pages/*`
- Support API client: `src/api/supportApi.js`
- Support config: `src/api/supportConfig.js`
- Location API client: `src/api/locationApi.js`
- Call hub (SignalR + WebRTC): `src/call/*`

---

## Key concepts

### IDs (critical)

Support endpoints use **GUIDs (JWT `sub`) in the URL path**.

- **memberId**: the requester user id (GUID)
- **dispatcherId**: the dispatcher user id (GUID)
- **staffId**: the staff user id (GUID)

The frontend obtains these ids via:

- JWT: `getJwtUserId()` inside `getCurrentUserIds()` (`src/api/supportApi.js`)
- Dev overrides via `localStorage` keys:
  - `support_member_id`
  - `support_staff_id`
  - `support_dispatcher_id`

If a member id is missing on ticket creation, the client uses a placeholder:

- `SUPPORT_PATH_MEMBER_PLACEHOLDER = "00000000-0000-0000-0000-000000000000"`

Meaning: “server should apply JWT `sub`”.

### Status lifecycle (UI expectations)

Across the UI, tickets are treated as:

- **Open**: `New`, `Assigned`, `InProgress`
- **Closed**: `Completed`, `Cancelled` / `Canceled`

**Dispatcher dashboard filters “open”** using:

- `new | assigned | inprogress` (case-insensitive normalization in UI)

**Member “My Requests” tabs**:

- Open: `New | Assigned | InProgress`
- Completed: `Completed`
- Cancelled: `Cancelled`

**Staff portal queue**:

- Only shows `New | Assigned | InProgress`
- After completion, ticket disappears from the active queue and appears in staff history.

---

## Environments & base URLs

### Support REST base

`src/api/supportConfig.js`:

- **Preferred**: `VITE_SUPPORT_API_BASE`
- **Fallbacks** (in order):
  - `${AUTH_API_BASE}/support/api`
  - `http://localhost:5000/support/api`
  - `http://127.0.0.1:5000/support/api`
  - `http://localhost:5008/api`

The client will try all bases and **retry across bases on**:

- network failures
- gateway errors: 502/503/504
- 404 (tries other candidates)

### Location service base (used in ticket creation)

`src/api/locationApi.js`:

- `VITE_LOCATION_API_BASE` or `${API_BASE}/location`
- The client tries multiple candidate paths (service root vs `/location` prefix), including:
  - `/api/v1/buildings`
  - `/api/v1/locations/buildings`
  - `/location/api/v1/buildings`
  - and additional variations for rooms

### Call service (SignalR + REST + ICE)

`src/call/callHubClient.ts`:

- Hub URL candidates:
  - `VITE_CALL_HUB_URL`, else `${VITE_API_BASE_URL|VITE_API_BASE}/call/hub`, else `https://myada.site/call/hub`
- ICE servers endpoint:
  - `VITE_CALL_ICE_SERVERS_URL`, else `{gatewayBase}/call/webrtc/ice-servers`
- Call history REST base:
  - `{gatewayBase}/call/api`

---

## Pages and workflows

## 1) Member: Create Support Request

**Routes/pages**

- IT form: `src/pages/ITSupport.jsx` → renders `SupportRequest` with `initialArea="it"`
- FM form: `src/pages/FMSupport.jsx` → renders `SupportRequest` with `initialArea="fm"`
- Shared form: `src/pages/SupportRequest.jsx`

### UI logic (validation & state)

Required before submit:

- **Issue category**: `issueCategory` must be non-empty
- **Location**: must be one of:
  - building + (room OR non-room details)
  - campus area (free text)
- **Description**: must be non-empty

Attachment handling:

- User may select multiple files (images/videos).
- Files are uploaded via `saveAttachmentsToMockFolder(files)`; if backend upload is unavailable, it falls back to localStorage “mock uploads”.

Draft:

- Saves form payload into a cookie `support_request_draft` (JSON).
- Restores that cookie on next open.

Dispatcher “call from form”:

- Loads “available dispatchers” from the **role directory endpoint** (Auth gateway).
- Can initiate a call via Call Hub (`requestCall(dispatcher.sub)`).

### Endpoints used

#### Load categories (Issue Category dropdown)

From `src/api/supportApi.js`:

- `GET /Categories/module/{module}`
  - `module` is `IT` when area=`it`, `FM` when area=`fm`

#### Load buildings + rooms

From `src/api/locationApi.js`:

- `GET (one of several candidates) /buildings`
- `GET (one of several candidates) /rooms/by-building/{buildingId}`

#### Upload attachments (optional)

From `src/api/supportApi.js`:

- `POST /SupportRequests/uploads`
  - `multipart/form-data` with `files`
  - Returns array of uploaded URLs/paths (if supported by backend)
  - Otherwise client stores mock files locally and returns `window.location.origin/...` URLs.

#### Create ticket

From `src/api/supportApi.js`:

- `POST /SupportRequests/member/{memberId}`
  - `memberId` is a GUID (JWT `sub`) OR placeholder `0000...` to allow server-side resolution
  - JSON body:

```json
{
  "area": "it|fm",
  "categoryId": 123,
  "locationType": "building|campus",
  "buildingId": 1,
  "placeType": "room|nonRoom",
  "roomId": 101,
  "areaDetails": "string|null",
  "description": "string",
  "urgency": "standard|critical",
  "attachmentUrls": ["https://..."]
}
```

Notes:

- `buildingId`, `roomId`, `placeType` are only set when `locationType === "building"`.
- `areaDetails`:
  - campus: `campusLocation` (free text)
  - building & nonRoom: `nonRoomLocation` (free text)
  - otherwise `null`

---

## 2) Member: My Requests (list)

**Page**

- `src/pages/MyRequests.jsx`

### UI logic

- Polls every 10s
- Tabs:
  - Open: `New | Assigned | InProgress`
  - Completed: `Completed`
  - Cancelled: `Cancelled`
- Search filters by:
  - id, description, category
- Category filter values are derived from already loaded requests.

### Endpoint used

From `src/api/supportApi.js`:

- `GET /SupportRequests/member/{memberId}`
  - Returns list of requests for the signed-in member
  - Client enriches `assignedTo` display name in some cases via Auth directory (`fetchAuthUserById`) when the ticket’s assignee label looks like an opaque id.

---

## 3) Member: Request Detail (view, call staff, cancel)

**Page**

- `src/pages/RequestDetail.jsx` (member view)

### UI logic

- Polls every 10s:
  - detail
  - timeline
- Cancel:
  - only enabled when ticket is open
  - requires non-empty `cancelReason`
- Call assigned staff:
  - only enabled when request has `assignedTo`
  - resolves a **callable** staff user id (see “Call routing rules” below)

### Endpoints used

From `src/api/supportApi.js`:

- `GET /SupportRequests/{requestId}` (detail)
- `GET /SupportRequests/{requestId}/timeline` (timeline)
- `PUT /SupportRequests/{requestId}/cancel/member/{memberId}`
  - JSON body: `{ "reason": "string" }`

Call routing helper (directory reconciliation):

- `resolveSupportRequestAssignedStaffCallTarget(requestOrDetail)`
  - Fetches staff directory users by role (Auth users-by-role endpoint) and matches:
    - assignedStaffUserId → directory `targetUserId`, or
    - assignedStaffUserId → directory `id`, or
    - assigned staff email/name (if unique)

---

## 4) Dispatcher: Ticket Queue (open tickets)

**Page**

- `src/pages/SupportDispatcher.jsx`

### UI logic

- Polls every 10s: `getAllRequests({ sortBy })`
- Filters to open tickets:
  - `New | Assigned | InProgress` (case/spacing tolerant)
- Tabs:
  - All / IT only / FM only / High priority
- Staff picker:
  - Loads staff options for IT and FM once at mount.
  - Uses `resolveStaffPickerModule(service, category)` to decide whether ticket belongs to IT or FM.
  - When dispatcher selects a staff member and hits “Confirm”, calls `assignRequest`.

### Endpoints used

From `src/api/supportApi.js`:

- `GET /SupportRequests?sortBy=newest|oldest` (and potentially other query params)
- Staff picker sources (see section “Staff directory / picker rules”):
  - Auth directory `users-by-role` (preferred)
  - SupportStaffStatuses fallback
  - Mock staff list fallback
- Assignment:
  - `PUT /SupportRequests/{requestId}/assign/dispatcher/{dispatcherId}`
  - JSON body:

```json
{
  "staffId": "GUID or directory id string",
  "dispatcherInstructions": "string"
}
```

---

## 5) Dispatcher: Ticket Detail (assign + internal instructions + timeline)

**Page**

- `src/pages/RequestDetailDispatcher.jsx`

### UI logic

- Polls every 10s:
  - request detail
  - timeline
- Staff options reloaded when `request.service` or `request.category` changes.
- Assignment:
  - If request already has `assignedStaffId`, selects it in dropdown.
  - Otherwise tries to match `assignedTo` name to options.
- “Confirm/Update Assignment” calls `assignRequest` with dispatcher notes.

### Endpoints used

From `src/api/supportApi.js`:

- `GET /SupportRequests/{requestId}`
- `GET /SupportRequests/{requestId}/timeline`
- `PUT /SupportRequests/{requestId}/assign/dispatcher/{dispatcherId}`

Also available in the API client (not always wired in UI):

- `PUT /SupportRequests/{requestId}/reassign/dispatcher/{dispatcherId}`
- `PUT /SupportRequests/{requestId}/dispatcher-instructions/dispatcher/{dispatcherId}`

---

## 6) Dispatcher: History (closed tickets)

**Page**

- `src/pages/SupportDispatcherHistory.jsx`

### UI logic

- Polls every 10s: `getAllRequests()`
- Filters down to closed:
  - status contains `completed` or `cancelled|canceled`
- Time windows:
  - last 7 / 30 / 90 days
  - custom date range

### Endpoint used

- `GET /SupportRequests` (same as dispatcher queue)

---

## 6.1) Dispatcher: Assign New Task (UI-only stub)

**Page**

- `src/pages/AssignTask.jsx` (linked from dispatcher/staff pages as `/support-dispatcher/assign-task`)

### Current behavior in this repo

- The form UI exists (draft cookie, validation, attachments picker), but **it does not call any backend yet**.
- Submit handler contains: `// TODO: send new assigned task to dispatcher API`.

### Mobile note

If you want “dispatcher creates a brand-new ticket and assigns it immediately”, you’ll need a backend endpoint and then wire it from this page (or implement it directly in mobile):

- likely: create a support request + assign in one step, or
- create request as dispatcher + assign + set dispatcher instructions.

---

## 7) Support Staff: Portal (assigned jobs list)

**Page**

- `src/pages/StaffPortal.jsx`

### UI logic

- Polls every 10s: `getStaffRequests(staffId)`
- Only shows open:
  - `New | Assigned | InProgress`
- Staff actions:
  - “Mark as Started” → sets status to in progress
  - “Complete” → completes and removes from active queue
- “Call Teacher” button:
  - Only works for teacher-created tickets (see call rules below).

### Endpoints used

From `src/api/supportApi.js`:

- `GET /SupportRequests/staff/{staffId}` (staff queue)
- `PUT /SupportRequests/{requestId}/in-progress/staff/{staffId}`
- `PUT /SupportRequests/{requestId}/complete/staff/{staffId}`

Call routing helper:

- `resolveSupportRequestTeacherCallTarget(requestOrDetail)`
  - Ensures creator is an instructor/teacher (uses Auth users-by-role data).

---

## 8) Support Staff: Ticket Detail (staff view)

**Page**

- `src/pages/StaffTicketDetail.jsx`

### UI logic

- Polls every 10s:
  - detail
  - timeline
- Access control:
  - Uses `staffMayViewSupportRequest(detail, staffId)`
  - Rule: staff can view if assignee id matches their staff id OR if API omits assignee id.
- Actions:
  - “Mark as Started” → `in-progress`
  - “Complete” → `complete`
- Call creator:
  - resolves teacher call target and calls via Call Hub

### Endpoints used

- `GET /SupportRequests/{requestId}`
- `GET /SupportRequests/{requestId}/timeline`
- `PUT /SupportRequests/{requestId}/in-progress/staff/{staffId}`
- `PUT /SupportRequests/{requestId}/complete/staff/{staffId}`

---

## Staff directory / picker rules

When assigning tickets, the UI needs a list of staff users.

From `src/api/supportApi.js`, staff picker logic is:

1) Prefer **Auth directory** users-by-role (gateway)
   - For IT assignments: role `it_staff`
   - For FM assignments: role `tech_staff`
2) Fallback to Support service statuses (if implemented by backend)
   - `GET /SupportStaffStatuses/status/Online`
   - `GET /SupportStaffStatuses/status/OnBreak`
3) Final fallback to mock staff list in the frontend.

Ticket-to-module mapping:

- `resolveStaffPickerModule(area, category)` returns `IT` or `FM`
  - Uses `area` first if it’s already `it/fm`
  - Otherwise infers based on keywords in category/service labels.

---

## Call integration (dispatcher/staff/member calling)

Calls are performed through a **SignalR Hub** and WebRTC audio.

### Hub URL

- Default: `{gatewayBase}/call/hub`
- Override: `VITE_CALL_HUB_URL`

### Authentication

- Hub uses bearer token: `accessTokenFactory() => getAccessToken()`
- If no access token exists or token is expired, hub connect is rejected and UI enters `auth-expired`.

### Hub methods invoked by the frontend

From `src/call/CallContext.tsx` and `src/call/callHubClient.ts`:

- `RequestCall(targetUserId)`
- `AcceptCall(callId)`
- `RejectCall(callId, reason?)`
- `CancelCall(callId, reason?)`
- `LeaveCall()`
- `EndCall()`
- `SendOffer(toConnectionId, sdp)`
- `SendAnswer(toConnectionId, sdp)`
- `SendIceCandidate(toConnectionId, candidate, sdpMid?, sdpMLineIndex?)`
- `GetIceConfiguration()`

### Hub events handled by the frontend

- `Connected`
- `IncomingCall`
- `CallRinging`
- `CallAccepted`
- `CallRejected`
- `CallCancelled`
- `CallTimedOut`
- `JoinedRoom`
- `LeftRoom`
- `ParticipantLeft`
- `ReceiveOffer`
- `ReceiveAnswer`
- `ReceiveIceCandidate`
- `CallEnded`

### Call routing rules implemented in UI

1) **Member calls assigned staff**
   - Member UI (`RequestDetail.jsx`) uses `resolveSupportRequestAssignedStaffCallTarget()`.
   - This reconciles the ticket’s stored assignee identifiers with the Auth directory so the call uses the **real JWT `sub`**.

2) **Support staff calls ticket creator**
   - Staff UI (`StaffPortal.jsx`, `StaffTicketDetail.jsx`) uses `resolveSupportRequestTeacherCallTarget()`.
   - Only “teacher/instructor” creators are callable from support.
   - Resolution uses:
     - direct `teacherCallTargetId` from support detail when present
     - or ticket creator id/email/name matched against Auth directory `users-by-role/instructor|teacher`

3) **Member calls dispatcher from request form**
   - Ticket creation UI loads dispatchers from the role directory endpoint and calls `requestCall(dispatcher.sub)`.

### ICE servers

Audio sessions require TURN/STUN servers from:

- `GET {gatewayBase}/call/webrtc/ice-servers`

### Call history (optional UI hydration)

The call UI also polls persisted history to “rehydrate” incoming calls when needed:

- `GET {gatewayBase}/call/api/call-history?status=pending&limit=20`

---

## Full Support REST endpoint list (as used by this frontend)

All routes below are relative to a Support API base such as `{AUTH_API_BASE}/support/api`.

### Categories

- `GET /Categories`
- `GET /Categories/module/{module}` where module is `IT` or `FM`

### Support requests

- `POST /SupportRequests/member/{memberId}` — create ticket
- `GET /SupportRequests/member/{memberId}` — member ticket list
- `GET /SupportRequests/staff/{staffId}` — staff ticket list (already server-scoped)
- `GET /SupportRequests` — dispatcher list (supports query filters like `sortBy`)
- `GET /SupportRequests/{requestId}` — ticket detail
- `GET /SupportRequests/{requestId}/timeline` — ticket activity timeline
- `PUT /SupportRequests/{requestId}/cancel/member/{memberId}` — member cancels ticket
- `PUT /SupportRequests/{requestId}/assign/dispatcher/{dispatcherId}` — dispatcher assigns staff
- `PUT /SupportRequests/{requestId}/reassign/dispatcher/{dispatcherId}` — dispatcher reassigns staff
- `PUT /SupportRequests/{requestId}/dispatcher-instructions/dispatcher/{dispatcherId}` — update internal notes
- `PUT /SupportRequests/{requestId}/start/staff/{staffId}` — staff starts ticket (available but not used in UI)
- `PUT /SupportRequests/{requestId}/in-progress/staff/{staffId}` — staff marks in progress (used)
- `PUT /SupportRequests/{requestId}/complete/staff/{staffId}` — staff completes (used)
- `POST /SupportRequests/uploads` — upload attachments (optional)

### Staff statuses (optional / may be unavailable)

- `GET /SupportStaffStatuses/status/{status}` where status in:
  - `Online`
  - `Offline`
  - `OnBreak`
- `GET /SupportStaffStatuses/member/{memberId}`

The client treats these routes as optional and caches “unavailable” if it gets 404/5xx.

---

## Common field normalization used by UI

The Support API response fields can vary; the client normalizes:

- **creator**: `createdById`, `creatorName`, `creatorEmail`, `creatorRoleLabel`
- **assignee**: `assignedStaffUserId` and a display label `assignedTo`
- **location**: built from:
  - raw `location` string OR
  - buildingId + roomId + `areaDetails`
- **attachments**:
  - `attachmentUrls`, `images`, `files`, etc. are normalized into:
    - `attachmentUrls`
    - `imageUrls` (for display in detail pages)

---

## Mobile implementation notes

- **Always treat path ids as GUID strings** (JWT `sub`), even when UI shows mock numeric ids.
- **Treat `status` values case-insensitively** and be resilient to `Cancelled` vs `Canceled`.
- **When making calls**, the target user id must be the target’s **JWT `sub`**, not a directory record id unless your backend uses them interchangeably.
- **Prefer Auth directory users-by-role** for staff/dispatcher pickers; SupportStaffStatuses is optional and may not exist in some deployments.

