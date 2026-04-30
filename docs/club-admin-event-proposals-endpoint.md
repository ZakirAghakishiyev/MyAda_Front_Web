# Club Admin Event Proposal Endpoint

## Endpoint

`POST https://myada.site/club/api/v1/club-admin/{clubId}/events/proposals`

Example with `clubId=1`:

`POST https://myada.site/club/api/v1/club-admin/1/events/proposals`

This endpoint is used by a club admin to submit an event proposal for review/approval. In this frontend, the main caller is `proposeClubAdminEvent(clubId, formState, imageFile)` in [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:1025), and the admin UI that collects the fields is [src/pages/club-admin/ClubAdminSuggestEvent.jsx](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\pages\club-admin\ClubAdminSuggestEvent.jsx:265).

## What It Does

The endpoint submits a proposed club event to the backend using either:

- `application/json`
- `multipart/form-data`

The frontend sends JSON when there is no file upload, and switches to multipart when there is a real image file. That behavior is implemented in [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:314).

The payload represents a normalized `EventProposalSubmitDto`:

- top-level event metadata such as `name`, `dateTime`, `duration`, `attendance`, `venue`
- event narrative fields such as `description` and `objectives`
- nested sub-events
- nested logistics flags
- optional room/building assignment preference
- optional image upload or already-hosted image URL

## Authentication

This is an authenticated endpoint.

- It requires `Authorization: Bearer <JWT>`
- The club client refuses to call it if there is no access token, raising `Authentication required.` first
- The shared auth fetch adds `Authorization: Bearer <accessToken>` automatically

Relevant code:

- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:88)
- [src/auth/authClient.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\auth\authClient.js:373)

## Content Types

### 1. JSON mode

Use `application/json` when you are not uploading a file.

In this mode, `subEvents` and `logistics` are sent as nested JSON values.

### 2. Multipart mode

Use `multipart/form-data` when you want to upload an image file directly.

In this mode:

- the image file must be attached as `imageFile`
- `subEvents` becomes `subEventsJson` as a JSON array string
- `logistics` becomes `logisticsJson` as a JSON object string

This conversion is implemented in [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:291).

## Required vs Optional Fields

There are two useful ways to think about "required" here:

### A. Required by the frontend validation in this repo

The shared validator currently enforces:

- `name`
- `dateTime`
- `duration`
- `attendance`

It also enforces these rules:

- `dateTime` must match `YYYY-MM-DDTHH:mm:ss`
- `duration` must be positive numeric-like
- `attendance` must be positive numeric-like
- `buildingId` and `roomId` must either both be present or both be absent
- if `imageUrl` is used, it must be an absolute `http` or `https` URL
- each sub-event must have `title`, `capacity`, `start`, and `end`

Relevant code:

- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:186)

### B. Fields that are part of the canonical multipart contract

In multipart mode, this frontend builds these form fields:

- `name`
- `dateTime`
- `duration`
- `attendance`
- `venue`
- `description`
- `objectives`
- `subEventsJson`
- `logisticsJson`
- `buildingId` when present
- `roomId` when present
- `submittedByOrganization` when present
- `imageUrl` when present
- `imageFile` when a file is uploaded

Relevant code:

- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:295)

### Practical classification

Use this as the safest contract:

- Required: `name`, `dateTime`, `duration`, `attendance`, `venue`, `description`, `objectives`, `subEventsJson`, `logisticsJson`
- Optional: `buildingId`, `roomId`, `submittedByOrganization`, `imageFile`, `imageUrl`
- Coupled optional pair: `buildingId` and `roomId` should be sent together

## Exact Multipart Form Structure

Multipart mode should look like this:

- `name`: text
- `dateTime`: text
- `duration`: text
- `attendance`: text
- `venue`: text
- `description`: text
- `objectives`: text
- `buildingId`: text integer, optional
- `roomId`: text integer, optional
- `submittedByOrganization`: text, optional
- `subEventsJson`: text containing a JSON array
- `logisticsJson`: text containing a JSON object
- `imageFile`: binary file, optional
- `imageUrl`: text URL, optional alternative to upload

### `subEventsJson`

This must be a single string field containing JSON, for example:

```json
[{"title":"Demo Booths","capacity":"80","start":"14:00","end":"16:00","date":"2026-05-10"}]
```

Expected item shape from the frontend builder:

- `title`
- `capacity`
- `start`
- `end`
- `date`

### `logisticsJson`

This must be a single string field containing JSON, for example:

```json
{"avSetup":true,"security":false,"catering":false,"cleaning":true,"otherNeeds":"Two projectors"}
```

Expected object shape from the frontend builder:

- `avSetup`: boolean
- `security`: boolean
- `catering`: boolean
- `cleaning`: boolean
- `otherNeeds`: string, optional

## How Image Upload Works

### Direct upload

If you want to upload a file directly:

- use `multipart/form-data`
- attach the file in the field named `imageFile`
- do not send the file in `imageUrl`

The frontend does exactly this:

- it keeps the selected file in a local variable named `posterFile`
- it passes that file into `proposeClubAdminEvent(...)`
- the API helper appends it to the outgoing `FormData` as `imageFile`

Relevant code:

- [src/pages/club-admin/ClubAdminSuggestEvent.jsx](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\pages\club-admin\ClubAdminSuggestEvent.jsx:269)
- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:316)

### Hosted URL

If you already have an image hosted somewhere public:

- send `imageUrl`
- it must be a valid absolute `http://` or `https://` URL

### If both are sent

Per the API notes embedded in the frontend:

- both `imageUrl` and `imageFile` may be sent
- the uploaded file wins

Relevant code:

- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:292)
- [src/pages/club-admin/ClubAdminSuggestEvent.jsx](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\pages\club-admin\ClubAdminSuggestEvent.jsx:485)

### Correct field name

The correct supported file field is:

- `imageFile`

Older aliases such as `posterFile` may exist historically, but this frontend does not send them. It always maps the UI's poster file to `imageFile`.

## Common Mistakes That Cause 400 / 415 Errors

### 400 Bad Request

Common payload mistakes:

- Missing `Authorization` token
- Missing `name`
- Missing or malformed `dateTime`
- Sending `dateTime=2026-05-10T14:00:00Z` when the current frontend validator expects local `YYYY-MM-DDTHH:mm:ss`
- Sending `duration=3 hours` when the current frontend validator expects a positive numeric-like value such as `3`
- Sending non-numeric `attendance`
- Sending only `buildingId` or only `roomId`
- Sending invalid JSON in `subEventsJson`
- Sending invalid JSON in `logisticsJson`
- Sending invalid `imageUrl`
- Sending sub-events with missing `title`, `capacity`, `start`, or `end`

Relevant frontend validation:

- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:193)

### 415 Unsupported Media Type

Common content-type mistakes:

- Sending a binary file in JSON instead of multipart
- Manually setting `Content-Type: multipart/form-data` without letting the browser add the boundary
- Sending `application/json` while also trying to upload a real file
- Using the wrong file field name such as `posterFile` instead of `imageFile`

Important frontend rule:

- when sending `FormData`, do not set `Content-Type` manually
- the browser/fetch layer should set the multipart boundary automatically

This is how the repo already handles file uploads for similar endpoints and is the right pattern here.

## Frontend Example Using FormData

```js
async function submitClubAdminEventProposal({ token, clubId, file }) {
  const formData = new FormData()

  formData.append('name', 'Spring Robotics Showcase')
  formData.append('dateTime', '2026-05-10T14:00:00')
  formData.append('duration', '3')
  formData.append('attendance', '120')
  formData.append('venue', 'Main Auditorium')
  formData.append('description', 'Club-wide demo event')
  formData.append('objectives', 'Showcase projects and recruit members')
  formData.append('buildingId', '2')
  formData.append('roomId', '14')
  formData.append(
    'subEventsJson',
    JSON.stringify([
      {
        title: 'Demo Booths',
        capacity: '80',
        start: '14:00',
        end: '16:00',
        date: '2026-05-10',
      },
    ])
  )
  formData.append(
    'logisticsJson',
    JSON.stringify({
      avSetup: true,
      security: false,
      catering: false,
      cleaning: true,
      otherNeeds: 'Two projectors',
    })
  )

  if (file) {
    formData.append('imageFile', file, file.name)
  }

  const response = await fetch(
    `https://myada.site/club/api/v1/club-admin/${encodeURIComponent(clubId)}/events/proposals`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed (${response.status})`)
  }

  return response.json()
}
```

## Curl Example

```bash
curl -X POST "https://myada.site/club/api/v1/club-admin/1/events/proposals" \
  -H "Authorization: Bearer <JWT>" \
  -F "name=Spring Robotics Showcase" \
  -F "dateTime=2026-05-10T14:00:00" \
  -F "duration=3" \
  -F "attendance=120" \
  -F "venue=Main Auditorium" \
  -F "description=Club-wide demo event" \
  -F "objectives=Showcase projects and recruit members" \
  -F "buildingId=2" \
  -F "roomId=14" \
  -F "subEventsJson=[{\"title\":\"Demo Booths\",\"capacity\":\"80\",\"start\":\"14:00\",\"end\":\"16:00\",\"date\":\"2026-05-10\"}]" \
  -F "logisticsJson={\"avSetup\":true,\"security\":false,\"catering\":false,\"cleaning\":true,\"otherNeeds\":\"Two projectors\"}" \
  -F "imageFile=@C:/path/to/poster.png;type=image/png"
```

## Important Mismatch to Watch

Your manually written curl example uses:

- `dateTime=2026-05-10T14:00:00Z`
- `duration=3 hours`

The current frontend helper in this repo does not send those values that way. It sends:

- `dateTime` as local `YYYY-MM-DDTHH:mm:ss` without `Z`
- `duration` as a numeric string such as `3`

That does not prove the backend will reject your original values when called directly, but it is the safest shape to use if you want behavior that matches the current frontend.

Relevant code:

- [src/pages/club-admin/ClubAdminSuggestEvent.jsx](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\pages\club-admin\ClubAdminSuggestEvent.jsx:69)
- [src/api/clubApi.js](C:\Users\cavid\OneDrive\Desktop\SDP-FRONTEND-LAST\MyAda_Front_Web\src\api\clubApi.js:193)
