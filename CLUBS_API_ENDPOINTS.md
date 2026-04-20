# Club API — Endpoints used by FrontWeb

All paths below are **relative to** `{CLUB_API_BASE}/api/v1/` unless noted.

- **`CLUB_API_BASE`** defaults to **`http://localhost:5003`** (local Club Management service). Override with **`VITE_CLUB_API_BASE`** (e.g. `http://13.60.31.141:5000/club` when using the deployed gateway).
- **Full URL pattern:** `{CLUB_API_BASE}/api/v1/<path>`
- **AutoWrapper:** successful JSON is unwrapped in the client when the body contains a top-level **`result`** or **`data`** field (see `unwrapApiResponse` in `clubApi.js`).
- **User-scoped routes:** `fetchMy*` helpers call **`users/{userId}/...`**, where **`userId`** is read from the JWT (`sub`, `user_id`, or common claim aliases) via `getJwtUserId()` in `jwtRoles.js`. It must match the token subject or the API returns **403**.
- **Authentication**
  - **`clubPublicJson`** — used only for **`GET categories`**. No bearer token.
  - **`clubAuthJson` / `clubAuthFetch`** — all other calls; **require an access token** (see `authFetch` / `getAccessToken`). Missing token triggers `forceLogoutAndRedirectLogin()` before the request.
- **Content types**
  - **`application/json`** — most `POST`/`PATCH`/`PUT` bodies.
  - **`multipart/form-data`** — `submitClubJoinApplication`, `submitVacancyApplication`, `submitClubProposal`, `patchClubAdminProfile` (browser sets boundary when `FormData` is passed).

Path parameters like `{clubId}` are URL-encoded in the client.

---

## 1. Categories (public)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `categories` | — | — | `fetchCategories()` |

---

## 2. Clubs (authenticated)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `clubs` | `search`, `category`, `page` (default 1), `limit` (default 12) | — | `fetchClubs(params)` |
| GET | `clubs/{clubId}` | — | — | `fetchClub(clubId)` |
| GET | `clubs/{clubId}/members` | — | — | `fetchClubMembers(clubId)` |
| POST | `clubs/{clubId}/join-applications` | — | **FormData** (e.g. `letterOfPurpose`, `portfolioLinks`, `portfolioFiles[]`) | `submitClubJoinApplication(clubId, formData)` |

---

## 3. Events (authenticated)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `events` | `clubId`, `myClubsOnly`, `search`, `page` (default 1), `limit` (default 24) | — | `fetchEvents(params)` |
| GET | `events/{eventId}` | — | — | `fetchEvent(eventId)` |
| POST | `events/{eventId}/registrations` | — | `{}` JSON | `registerForEvent(eventId)` |
| DELETE | `events/{eventId}/registrations` | — | — | `unregisterFromEvent(eventId)` |
| GET | `events/{eventId}/ticket` | — | — | `fetchEventTicket(eventId)` |

---

## 4. Vacancies (authenticated)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `vacancies` | `search`, `category`, `savedOnly`, `page` (default 1), `limit` (default 12) | — | `fetchVacancies(params)` |
| GET | `vacancies/{vacancyId}` | — | — | `fetchVacancy(vacancyId)` |
| GET | `vacancies/by-club/{clubId}` | `page` (default 1), `limit` (default 12) | — | `fetchVacanciesByClub(clubId, params)` |
| POST | `vacancies/{vacancyId}/applications` | — | **FormData** (e.g. CV / fields per API contract) | `submitVacancyApplication(vacancyId, formData)` |

---

## 5. Current user (authenticated) — `users/{userId}/...`

`{userId}` is the signed-in user’s GUID (from JWT). Client: `getJwtUserId()` in `src/auth/jwtRoles.js`.

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `users/{userId}/club-memberships` | — | — | `fetchMyClubMemberships()` |
| GET | `users/{userId}/vacancy-applications` | `page` (default 1), `limit` (default 50) | — | `fetchMyVacancyApplications(params)` |
| GET | `users/{userId}/membership-applications` | — | — | `fetchMyMembershipApplications()` |
| GET | `users/{userId}/event-registrations` | — | — | `fetchMyEventRegistrations()` |
| GET | `users/{userId}/club-notifications` | `type` (default `'all'`) | — | `fetchMyClubNotifications(type)` |
| PATCH | `users/{userId}/club-notifications/{notificationId}/read` | — | `{}` JSON | `markClubNotificationRead(notificationId)` |

---

## 6. Club proposals — student submit (authenticated)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| POST | `club-proposals` | — | **FormData** (multipart proposal) | `submitClubProposal(formData)` |

---

## 7. Applications — interview slots (authenticated)

Used for applicants choosing interview times (slots returned for an application).

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `applications/{applicationId}/interview-slots` | — | — | `fetchApplicationInterviewSlots(applicationId)` |
| POST | `applications/{applicationId}/interview-slot` | — | `{ "slotId": "<id>" }` | `selectInterviewSlot(applicationId, slotId)` |

---

## 8. Club admin (authenticated)

Prefix for all rows in this section: **`club-admin/{clubId}/`** (the client builds `club-admin/${clubId}/...`).

### Dashboard & applications

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `club-admin/{clubId}/dashboard` | — | — | `fetchClubAdminDashboard(clubId)` |
| GET | `club-admin/{clubId}/applications` | `type`, `status`, `page` (default 1), `limit` (default 100) | — | `fetchClubAdminApplications(clubId, params)` |
| GET | `club-admin/{clubId}/applications/{applicationId}` | — | — | `fetchClubAdminApplication(clubId, applicationId)` |
| POST | `club-admin/{clubId}/applications/{applicationId}/approve` | — | `{}` | `approveClubAdminApplication(clubId, applicationId)` |
| POST | `club-admin/{clubId}/applications/{applicationId}/reject` | — | `{ "reason": "..." }` | `rejectClubAdminApplication(clubId, applicationId, reason)` |
| POST | `club-admin/{clubId}/applications/{applicationId}/request-changes` | — | `{ "changes": "..." }` | `requestChangesClubAdminApplication(clubId, applicationId, changes)` |
| POST | `club-admin/{clubId}/applications/{applicationId}/notes` | — | `{ "note": "..." }` | `addClubAdminApplicationNote(clubId, applicationId, note)` |
| POST | `club-admin/{clubId}/applications/bulk-decision` | — | **JSON** (opaque `body` — selection + action; shape defined by backend) | `clubAdminBulkDecision(clubId, body)` |

### Interview slots (admin)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `club-admin/{clubId}/interview-slots` | `page` (default 1), `limit` (default 50) | — | `fetchClubAdminInterviewSlots(clubId, params)` |
| POST | `club-admin/{clubId}/interview-slots/generate` | — | **JSON** (date range, length, vacancy id, etc. — see `ClubAdminInterviewTimes.jsx`) | `generateClubAdminInterviewSlots(clubId, body)` |
| PATCH | `club-admin/{clubId}/interview-slots/{slotId}` | — | **JSON** | `patchClubAdminInterviewSlot(clubId, slotId, body)` |
| DELETE | `club-admin/{clubId}/interview-slots/{slotId}` | — | — | `deleteClubAdminInterviewSlot(clubId, slotId)` |

### Vacancies (admin)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `club-admin/{clubId}/vacancies` | `status`, `page` (default 1), `limit` (default 50) | — | `fetchClubAdminVacancies(clubId, params)` |
| POST | `club-admin/{clubId}/vacancies` | — | **JSON** | `createClubAdminVacancy(clubId, body)` |
| PATCH | `club-admin/{clubId}/vacancies/{vacancyId}` | — | **JSON** | `patchClubAdminVacancy(clubId, vacancyId, body)` |
| PATCH | `club-admin/{clubId}/vacancies/{vacancyId}/status` | — | `{ "status": "..." }` | `patchClubAdminVacancyStatus(clubId, vacancyId, status)` |

### Members & employees (admin)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `club-admin/{clubId}/members` | `page` (default 1), `limit` (default 50) | — | `fetchClubAdminMembers(clubId, params)` |
| DELETE | `club-admin/{clubId}/members/{memberId}` | — | — | `deleteClubAdminMember(clubId, memberId)` |
| GET | `club-admin/{clubId}/employees` | `page` (default 1), `limit` (default 50) | — | `fetchClubAdminEmployees(clubId, params)` |
| POST | `club-admin/{clubId}/employees` | — | **JSON** | `createClubAdminEmployee(clubId, body)` |
| PATCH | `club-admin/{clubId}/employees/positions` | — | **JSON** (batch position updates) | `patchClubAdminEmployeesPositions(clubId, body)` |
| DELETE | `club-admin/{clubId}/employees/{employeeId}` | — | — | `deleteClubAdminEmployee(clubId, employeeId)` |

### Events (admin)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `club-admin/{clubId}/events` | — | — | `fetchClubAdminEvents(clubId)` |
| PATCH | `club-admin/{clubId}/events/{eventId}` | — | **JSON** | `patchClubAdminEvent(clubId, eventId, body)` |
| POST | `club-admin/{clubId}/events/proposals` | — | **JSON** (event proposal to institution) | `proposeClubAdminEvent(clubId, body)` |
| GET | `club-admin/{clubId}/events/{eventId}/attendees` | — | — | `fetchClubAdminEventAttendees(clubId, eventId)` |
| PATCH | `club-admin/{clubId}/events/{eventId}/attendees/{attendeeId}` | — | **JSON** | `patchClubAdminEventAttendee(clubId, eventId, attendeeId, body)` |
| DELETE | `club-admin/{clubId}/events/{eventId}/attendees/{attendeeId}` | — | — | `deleteClubAdminEventAttendee(clubId, eventId, attendeeId)` |

### Profile & announcements (admin)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| PATCH | `club-admin/{clubId}/profile` | — | **FormData** (multipart club profile update) | `patchClubAdminProfile(clubId, formData)` |
| POST | `club-admin/{clubId}/announcements` | — | `{ "title": "...", "message": "..." }` | `postClubAdminAnnouncement(clubId, body)` |

### Positions (admin)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `club-admin/{clubId}/positions` | `page` (default 1), `limit` (default 50) | — | `fetchClubAdminPositions(clubId, params)` |
| POST | `club-admin/{clubId}/positions` | — | **JSON** | `createClubAdminPosition(clubId, body)` |
| PATCH | `club-admin/{clubId}/positions/{positionId}` | — | **JSON** | `patchClubAdminPosition(clubId, positionId, body)` |
| DELETE | `club-admin/{clubId}/positions/{positionId}` | — | — | `deleteClubAdminPosition(clubId, positionId)` |

---

## 9. Student services (authenticated)

### Dashboard & directory

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `student-services/dashboard` | — | — | `fetchStudentServicesDashboard()` |
| GET | `student-services/clubs` | `search`, `page` (default 1), `limit` (default 12) | — | `fetchStudentServicesClubs(params)` |
| GET | `student-services/clubs/{clubId}` | — | — | `fetchStudentServicesClub(clubId)` |
| PATCH | `student-services/clubs/{clubId}` | — | **JSON** | `patchStudentServicesClub(clubId, body)` |
| POST | `student-services/clubs/{clubId}/profile-image/approve` | — | `{}` | `approveStudentServicesClubProfileImage(clubId)` |

### Club proposals (institutional review)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `student-services/club-proposals` | — | — | `fetchStudentServicesClubProposals()` |
| GET | `student-services/club-proposals/{proposalId}` | — | — | `fetchStudentServicesClubProposal(proposalId)` |
| POST | `student-services/club-proposals/{proposalId}/approve` | — | `{}` | `approveStudentServicesClubProposal(proposalId)` |
| POST | `student-services/club-proposals/{proposalId}/reject` | — | `{ "reason": "..." }` | `rejectStudentServicesClubProposal(proposalId, reason)` |
| POST | `student-services/club-proposals/{proposalId}/request-revision` | — | `{ "changes": "..." }` | `requestRevisionStudentServicesClubProposal(proposalId, changes)` |

### Club proposal requirements (policy text / deadline)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `student-services/club-proposal-requirements` | — | — | `fetchStudentServicesProposalRequirements()` |
| PUT | `student-services/club-proposal-requirements` | — | **JSON** (e.g. `requirements[]`, `deadline`) | `putStudentServicesProposalRequirements(body)` |

### Event proposals (institutional review)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `student-services/event-proposals` | — | — | `fetchStudentServicesEventProposals()` |
| GET | `student-services/event-proposals/{proposalId}` | — | — | `fetchStudentServicesEventProposal(proposalId)` |
| POST | `student-services/event-proposals/{proposalId}/approve` | — | `{ "assignments": ... }` (room/building routing) | `approveStudentServicesEventProposal(proposalId, assignments)` |
| POST | `student-services/event-proposals/{proposalId}/reject` | — | `{ "reason": "..." }` | `rejectStudentServicesEventProposal(proposalId, reason)` |
| POST | `student-services/event-proposals/{proposalId}/request-revision` | — | `{ "changes": "..." }` | `requestRevisionStudentServicesEventProposal(proposalId, changes)` |

### Approved events (institutional)

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `student-services/events` | — | — | `fetchStudentServicesEvents()` |
| POST | `student-services/events` | — | **JSON** | `createStudentServicesEvent(body)` |
| GET | `student-services/events/{eventId}` | — | — | `getStudentServicesEvent(eventId)` |
| PATCH | `student-services/events/{eventId}` | — | **JSON** | `patchStudentServicesEvent(eventId, body)` |
| DELETE | `student-services/events/{eventId}` | — | — | `deleteStudentServicesEvent(eventId)` |

### Members & employees under student-services directory

| Method | Path | Query | Body | Client function |
|--------|------|-------|------|-----------------|
| GET | `student-services/clubs/{clubId}/members` | — | — | `fetchStudentServicesClubMembers(clubId)` |
| PATCH | `student-services/clubs/{clubId}/members/{memberId}` | — | **JSON** | `patchStudentServicesClubMember(clubId, memberId, body)` |
| DELETE | `student-services/clubs/{clubId}/members/{memberId}` | — | — | `deleteStudentServicesClubMember(clubId, memberId)` |
| GET | `student-services/clubs/{clubId}/employees` | — | — | `fetchStudentServicesClubEmployees(clubId)` |
| POST | `student-services/clubs/{clubId}/employees` | — | **JSON** | `createStudentServicesClubEmployee(clubId, body)` |
| PATCH | `student-services/clubs/{clubId}/employees/{employeeId}` | — | **JSON** | `patchStudentServicesClubEmployee(clubId, employeeId, body)` |
| DELETE | `student-services/clubs/{clubId}/employees/{employeeId}` | — | — | `deleteStudentServicesClubEmployee(clubId, employeeId)` |

---

## 10. Frontend coverage notes

- **`src/api/clubApi.js`** is the single source of truth for paths above.
- Some functions are **not yet imported** by any page (still part of the intended contract): e.g. `unregisterFromEvent`, `fetchVacanciesByClub`, `fetchStudentServicesDashboard`, `fetchStudentServicesClub`, single-item proposal getters, `deleteStudentServicesEvent`, `approveStudentServicesClubProfileImage`, `createClubAdminEmployee`.
- Exact **JSON field names** for complex bodies (vacancy create, event proposal, student-services event create, bulk decision) should match the backend OpenAPI/spec; the UI forms in `StudentServices.jsx`, `ClubAdminSuggestEvent.jsx`, etc. show the shapes the frontend sends.

---

*Generated from `src/api/clubApi.js` and `src/api/clubConfig.js`.*
