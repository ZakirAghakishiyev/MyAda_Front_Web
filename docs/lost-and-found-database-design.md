# Lost and Found – Database Design

Design aligned with the Report Lost / Report Found form: basic info, location (Building vs Campus), description, and photos.

---

## 1. Entity Relationship Overview

- **Users** – who submits the report (for “My announcements”).
- **Categories** – lookup (Electronics, Documents, Personal Items, Accessories).
- **Buildings** – lookup (Main Building, Library, Sports Complex, etc.).
- **Rooms** – per-building areas (optional when location is Building).
- **Lost/Found Items** – one row per report; links to user, category, and location.
- **Item Photos** – one row per photo per item.

---

## 2. Core Tables

### 2.1 `users` (existing or minimal)

Assumes you already have a users table; only needed fields for L&F are referenced here.

| Column       | Type         | Notes                    |
|-------------|--------------|--------------------------|
| id          | PK           | User identifier          |
| email       | VARCHAR(255) | For notifications        |
| ...         | …            | Other auth/profile cols  |

---

### 2.2 `categories`

Predefined categories from the form dropdown.

| Column     | Type         | Constraints | Notes                    |
|-----------|--------------|-------------|--------------------------|
| id        | INT / UUID   | PK          |                          |
| name      | VARCHAR(100) | NOT NULL UNIQUE | e.g. Electronics, Documents |

**Example rows:** Electronics, Documents, Personal Items, Accessories.

---

### 2.3 `buildings`

Buildings from the “Building” dropdown (Main Building, Library, Sports Complex, Cafeteria, Other).

| Column     | Type         | Constraints | Notes    |
|-----------|--------------|-------------|----------|
| id        | INT / UUID   | PK          |          |
| code      | VARCHAR(50)  | NOT NULL UNIQUE | e.g. main, library |
| name      | VARCHAR(150) | NOT NULL    | Display name |

---

### 2.4 `rooms`

Rooms/areas per building (shown when “Is it a room?” = Yes). Optional “Room” or “Location details” from the form.

| Column      | Type         | Constraints | Notes                |
|------------|--------------|-------------|----------------------|
| id         | INT / UUID   | PK          |                      |
| building_id| INT / UUID   | FK → buildings, NOT NULL | |
| name       | VARCHAR(150) | NOT NULL   | e.g. 101, Reading Hall |
| is_room    | BOOLEAN      | DEFAULT true | Distinguish room vs “another area” |

---

### 2.5 `lost_found_items` (main report table)

One row per lost or found report. Captures form: item name, category, location type (Building vs Campus), building/room/campus details, description, and link to user and photos.

| Column           | Type           | Constraints | Notes |
|-----------------|----------------|-------------|--------|
| id              | INT / UUID     | PK          | |
| **Type & ownership** | | | |
| item_type       | ENUM('lost','found') | NOT NULL | From form: “Report Lost” vs “Report Found” |
| posted_by_user_id | INT / UUID   | FK → users, NOT NULL | For “My announcements” |
| **Basic info (form)** | | | |
| item_name       | VARCHAR(255)   | NOT NULL    | “Item Name *” |
| category_id     | INT / UUID     | FK → categories, NOT NULL | “Category *” |
| description    | VARCHAR(500)   | NULL        | “Description”, 0/500 chars |
| **Location (form)** | | | |
| location_type   | ENUM('building','campus') | NULL | “Choose location type” (Building / Campus) |
| building_id     | INT / UUID     | FK → buildings, NULL | Required when location_type = building |
| is_room         | BOOLEAN        | NULL        | “Is it a room?” (yes/no) |
| room_id         | INT / UUID     | FK → rooms, NULL | When is_room = true and building chosen |
| room_or_area_details | VARCHAR(255) | NULL | When is_room = false: “Location details” (e.g. Lobby near reception) |
| campus_location | VARCHAR(255)   | NULL        | When location_type = campus: free text |
| **Derived / display** | | | |
| location_display| VARCHAR(500)   | NULL        | Optional: cached “Building – Room” or campus text for list/detail views |
| **Status & workflow** | | | |
| status          | VARCHAR(50)   | NOT NULL DEFAULT 'Pending Verification' | e.g. Active, Pending Verification |
| admin_status    | ENUM('Pending','Received','Delivered') | NULL | Admin workflow |
| reference_number | VARCHAR(50)   | UNIQUE, NULL | e.g. LF-000001 |
| **Timestamps**  | | | |
| created_at      | TIMESTAMP      | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at      | TIMESTAMP      | NOT NULL ON UPDATE | |

**Location rules (align with form):**

- **Lost:** Location is optional → all location_* fields nullable.
- **Found:** Location required → at least one of:
  - `location_type = 'building'` and `building_id` set, plus `room_id` or `room_or_area_details` when applicable, or  
  - `location_type = 'campus'` and `campus_location` set.

You can enforce this in app logic or with a CHECK constraint (e.g. “if item_type = 'found' then (location_type and (building_id or campus_location))”).

---

### 2.6 `item_photos`

Multiple photos per item (form: “Photos”, PNG/JPG, optional for lost, required for found in UI).

| Column       | Type         | Constraints | Notes |
|-------------|--------------|-------------|--------|
| id          | INT / UUID   | PK          | |
| item_id     | INT / UUID   | FK → lost_found_items, NOT NULL, ON DELETE CASCADE | |
| file_path   | VARCHAR(500) | NOT NULL    | Stored path or URL after upload |
| file_name   | VARCHAR(255) | NULL        | Original name |
| file_size_bytes | INT        | NULL        | Optional, e.g. up to 10MB |
| mime_type   | VARCHAR(50)  | NULL        | e.g. image/jpeg, image/png |
| sort_order  | INT          | DEFAULT 0   | Display order |
| created_at  | TIMESTAMP    | NOT NULL DEFAULT CURRENT_TIMESTAMP | |

---

## 3. SQL (MySQL-style) Example

```sql
-- Lookups
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE buildings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL
);

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_room BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Main report table
CREATE TABLE lost_found_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_type ENUM('lost','found') NOT NULL,
  posted_by_user_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  description VARCHAR(500) NULL,
  location_type ENUM('building','campus') NULL,
  building_id INT NULL,
  is_room TINYINT(1) NULL,
  room_id INT NULL,
  room_or_area_details VARCHAR(255) NULL,
  campus_location VARCHAR(255) NULL,
  location_display VARCHAR(500) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending Verification',
  admin_status ENUM('Pending','Received','Delivered') NULL,
  reference_number VARCHAR(50) NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by_user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE item_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NULL,
  file_size_bytes INT NULL,
  mime_type VARCHAR(50) NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES lost_found_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_lost_found_items_type ON lost_found_items(item_type);
CREATE INDEX idx_lost_found_items_posted_by ON lost_found_items(posted_by_user_id);
CREATE INDEX idx_lost_found_items_status ON lost_found_items(status);
CREATE INDEX idx_item_photos_item_id ON item_photos(item_id);
```

---

## 4. Mapping Form → Database

| Form section / field     | Table.Column(s) |
|--------------------------|-----------------|
| Report Lost / Found      | lost_found_items.item_type |
| Item Name *              | lost_found_items.item_name |
| Category *               | lost_found_items.category_id → categories |
| Location (optional/required) | lost_found_items.location_type, building_id, room_id, room_or_area_details, campus_location |
| Choose location type     | lost_found_items.location_type ('building' \| 'campus') |
| Building                 | lost_found_items.building_id → buildings |
| Is it a room?            | lost_found_items.is_room |
| Room                     | lost_found_items.room_id → rooms |
| Location details         | lost_found_items.room_or_area_details |
| Campus location          | lost_found_items.campus_location |
| Description              | lost_found_items.description (max 500) |
| Photos                   | item_photos (file_path, etc.) |
| Submitter                | lost_found_items.posted_by_user_id → users |

---

## 5. Queries for Your App

- **Lost items:** `WHERE item_type = 'lost'`
- **Found items:** `WHERE item_type = 'found'`
- **My announcements:** `WHERE posted_by_user_id = :current_user_id`
- **List/detail location:** Use `location_display` or build from `location_type` + building/room/campus columns.

This design supports the form’s location types (Building vs Campus), room vs area, and lost vs found, and keeps a clear place for categories, buildings, rooms, and photos.
