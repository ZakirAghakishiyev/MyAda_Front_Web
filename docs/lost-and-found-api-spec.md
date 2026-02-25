# Lost & Found API – Endpoints (Inputs & Outputs)

Base URL: `/api` (e.g. `https://your-backend.com/api`)

---

## 1. List items (public or admin)

**GET** `/lost-and-found/items`

### Inputs

| Where        | Type   | Name (query) | Description |
|-------------|--------|--------------|-------------|
| **Headers** | string | `Authorization` | Optional. If present (e.g. `Bearer <token>`), return admin list with `adminStatus`. If absent, return public list only. |
| **Query**   | string | `category`   | Filter: e.g. `Electronics`, `Documents`, `All Items`. |
| **Query**   | string | `search` or `q` | Search in title, location, description. |
| **Query**   | string | `adminStatus` | Admin only: `Pending`, `Received`, `Delivered`. |
| **Query**   | number | `page`       | Page number (default 1). |
| **Query**   | number | `limit`      | Items per page (default 10). |

### Outputs

| Where         | Type   | Description |
|---------------|--------|-------------|
| **Status**    | number | `200` |
| **Body**      | object | `{ "items": [ ... ], "total": number }` |
| **Item shape**| object | `id`, `title`, `location`, `category`, `status`, `description`, `referenceNumber`, `datePosted`, `image` (URL or null), `daysAgo`. If admin: also `adminStatus` (`Pending` \| `Received` \| `Delivered`). |

**Example response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Student ID Card",
      "location": "Cafeteria - Near Entrance",
      "category": "Documents",
      "status": "Active",
      "adminStatus": "Received",
      "daysAgo": 79,
      "description": "ADA University student ID card.",
      "referenceNumber": "LF-000001",
      "datePosted": "Jan 15, 2026",
      "image": "/images/lost-and-found/notebooks.png"
    }
  ],
  "total": 5
}
```

---

## 2. Get one item (public or admin)

**GET** `/lost-and-found/items/:id`

### Inputs

| Where        | Type   | Name | Description |
|-------------|--------|------|-------------|
| **Headers** | string | `Authorization` | Optional. If present, can return admin-only fields. |
| **Path**    | number | `id` | Item ID. |

### Outputs

| Where  | Type   | Description |
|--------|--------|-------------|
| **Status** | number | `200` OK, `404` Not Found. |
| **Body**   | object | Single item (same shape as in list; admin gets `adminStatus` etc.). |

**Example response (200):**
```json
{
  "id": 1,
  "title": "Student ID Card",
  "location": "Cafeteria - Near Entrance",
  "category": "Documents",
  "status": "Active",
  "adminStatus": "Received",
  "daysAgo": 79,
  "description": "ADA University student ID card.",
  "referenceNumber": "LF-000001",
  "datePosted": "Jan 15, 2026",
  "image": "/images/lost-and-found/notebooks.png"
}
```

---

## 3. Report lost item

**POST** `/lost-and-found/reports/lost`

### Inputs

| Where        | Type   | Name | Description |
|-------------|--------|------|-------------|
| **Headers** | string | `Content-Type` | `application/json` **or** `multipart/form-data` if sending photos. |
| **Headers** | string | `Authorization` | Optional (if users are logged in). |
| **Body**    | object | (if JSON) see below. |

**Request body (JSON):**

| Field        | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `itemName`  | string | yes      | Name of item. |
| `category`  | string | yes      | e.g. `Electronics`, `Documents`, `Clothing`, `Other`. |
| `color`     | string | no       | Color (e.g. hex or name). |
| `brand`     | string | no       | Brand. |
| `building`  | string | yes      | Building. |
| `floor`     | string | no       | Floor. |
| `roomArea`  | string | no       | Room or area. |
| `lastKnownLocation` | string | yes | Last known location text. |
| `dateLost`  | string | yes      | Date (e.g. `YYYY-MM-DD`). |
| `timeLost`  | string | no       | Time. |
| `description` | string | no     | Description (max 500). |
| `contactName`  | string | no    | Reporter name. |
| `contactPhone` | string | no    | Reporter phone. |
| `photoUrls` | string[] | no    | URLs if upload is separate; omit if using multipart. |

If **multipart/form-data**: same fields as form fields; photos as files (e.g. `photos[]` or `photos`). Backend returns image URLs and stores them.

### Outputs

| Where  | Type   | Description |
|--------|--------|-------------|
| **Status** | number | `201` Created, `400` Bad request. |
| **Body**   | object | Created report/item. |

**Example response (201):**
```json
{
  "id": 6,
  "referenceNumber": "LF-000006",
  "status": "Pending Verification",
  "message": "Lost item report submitted for review."
}
```

---

## 4. Report found item

**POST** `/lost-and-found/reports/found`

### Inputs

| Where        | Type   | Name | Description |
|-------------|--------|------|-------------|
| **Headers** | string | `Content-Type` | `application/json` or `multipart/form-data`. |
| **Headers** | string | `Authorization` | Optional. |
| **Body**    | object | Same as lost report, plus one extra field. |

**Request body (JSON)** – same as lost, plus:

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| `collectionPlace`  | string | yes      | Where the item can be collected. |

(All other fields same as “Report lost item”.)

### Outputs

| Where  | Type   | Description |
|--------|--------|-------------|
| **Status** | number | `201` Created, `400` Bad request. |
| **Body**   | object | Created report. |

**Example response (201):**
```json
{
  "id": 7,
  "referenceNumber": "LF-000007",
  "status": "Pending Verification",
  "message": "Found item report submitted for review."
}
```

---

## 5. Update item (admin: status, notes, etc.)

**PATCH** `/lost-and-found/items/:id`

### Inputs

| Where        | Type   | Name | Description |
|-------------|--------|------|-------------|
| **Headers** | string | `Authorization` | Required (admin). |
| **Path**   | number | `id` | Item ID. |
| **Body**   | object | Only send fields you want to change. |

**Request body (all optional):**

| Field         | Type   | Description |
|---------------|--------|-------------|
| `adminStatus` | string | `Pending` \| `Received` \| `Delivered`. |
| `title`       | string | Title. |
| `description` | string | Description. |
| `storageBinId`| string | Office storage bin / ID (from verify modal). |
| `condition`   | string | e.g. `good`, `fair`, `damaged`. |
| `adminNotes`  | string | Internal notes. |

### Outputs

| Where  | Type   | Description |
|--------|--------|-------------|
| **Status** | number | `200` OK, `400` Bad request, `404` Not found. |
| **Body**   | object | Updated item (full item object). |

**Example response (200):**
```json
{
  "id": 3,
  "title": "Black Leather Wallet",
  "adminStatus": "Received",
  "referenceNumber": "LF-000003",
  "storageBinId": "BIN-402-A",
  "condition": "good"
}
```

---

## 6. (Optional) Admin – create item manually

**POST** `/lost-and-found/items`

### Inputs

| Where        | Type   | Name | Description |
|-------------|--------|------|-------------|
| **Headers** | string | `Authorization` | Required (admin). |
| **Headers** | string | `Content-Type` | `application/json` or `multipart/form-data`. |
| **Body**    | object | New item fields. |

**Request body (JSON):**

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `title`       | string | yes      | Item name. |
| `category`    | string | yes      | Category. |
| `location`    | string | yes      | Where found/stored. |
| `description` | string | no       | Description. |
| `adminStatus` | string | no       | Default `Pending`. `Pending` \| `Received` \| `Delivered`. |
| `image`       | string | no       | Image URL (or send file via multipart). |

### Outputs

| Where  | Type   | Description |
|--------|--------|-------------|
| **Status** | number | `201` Created, `400` Bad request. |
| **Body**   | object | Created item (with `id`, `referenceNumber`, etc.). |

**Example response (201):**
```json
{
  "id": 8,
  "referenceNumber": "LF-000008",
  "title": "Umbrella",
  "category": "Other",
  "location": "Main Building",
  "adminStatus": "Pending",
  "datePosted": "Feb 26, 2026"
}
```

---

## 7. (Optional) Upload photo

**POST** `/lost-and-found/upload`

Use when you want to upload images first and then send their URLs in report or item bodies.

### Inputs

| Where        | Type   | Name | Description |
|-------------|--------|------|-------------|
| **Headers** | string | `Authorization` | Optional. |
| **Headers** | string | `Content-Type` | `multipart/form-data`. |
| **Body**    | file   | `file` or `photo` | One image file. |

### Outputs

| Where  | Type   | Description |
|--------|--------|-------------|
| **Status** | number | `201` Created, `400` Bad request. |
| **Body**   | object | URL of stored image. |

**Example response (201):**
```json
{
  "url": "https://your-backend.com/uploads/lost-and-found/abc123.jpg"
}
```

---

## Quick reference

| # | Method | Endpoint | Input (main) | Output |
|---|--------|----------|--------------|--------|
| 1 | GET | `/lost-and-found/items` | Headers: optional `Authorization`. Query: `category`, `search`, `adminStatus`, `page`, `limit`. | `{ items, total }` |
| 2 | GET | `/lost-and-found/items/:id` | Path: `id`. Headers: optional `Authorization`. | Single item or 404 |
| 3 | POST | `/lost-and-found/reports/lost` | Body: item details + contact + optional `photoUrls` or multipart photos. | `{ id, referenceNumber, status, message }` |
| 4 | POST | `/lost-and-found/reports/found` | Body: same as lost + `collectionPlace`. | Same as lost |
| 5 | PATCH | `/lost-and-found/items/:id` | Headers: `Authorization`. Body: `adminStatus`, etc. | Updated item |
| 6 | POST | `/lost-and-found/items` | Headers: `Authorization`. Body: new item fields. | Created item |
| 7 | POST | `/lost-and-found/upload` | Multipart: one image file. | `{ url }` |
