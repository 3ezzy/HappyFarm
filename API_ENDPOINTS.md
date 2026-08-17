# API Endpoints Quick Reference

Base URL: `http://localhost:8000/api`

## Authentication Endpoints

### Register User
```http
POST /api/register
```
**Request Body:**
```json
{
  "name": "Ali Eid",
  "email": "ali@example.com", 
  "password": "password",
  "password_confirmation": "password"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "name": "Ali Eid",
    "email": "ali@example.com"
  },
  "farm": {
    "id": 1,
    "name": "Ali Eid's Farm"
  },
  "token": "1|abcdef..."
}
```

### Login User
```http
POST /api/login
```
**Request Body:**
```json
{
  "email": "ali@example.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Ali Eid",
    "email": "ali@example.com"
  },
  "farm": {
    "id": 1,
    "name": "Ali Eid's Farm"
  },
  "token": "2|abcdef..."
}
```

### Logout User
```http
POST /api/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

## Farm Management Endpoints
*All endpoints require `Authorization: Bearer {token}` header*

### Get Farm Details
```http
GET /api/farm
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Ali Eid's Farm",
  "owner": {
    "id": 1,
    "name": "Ali Eid",
    "email": "ali@example.com"
  },
  "created_at": "2025-06-24T10:00:00.000000Z",
  "statistics": {
    "total_animals": 5,
    "by_type": {
      "sheep": 2,
      "goat": 1,
      "cow": 1,
      "camel": 1
    },
    "sacrificed_animals": 1,
    "eligible_for_sacrifice": 3,
    "recently_fed": 2,
    "recently_groomed": 1
  }
}
```

### Get Farm Statistics
```http
GET /api/farm/statistics
```

**Response (200):**
```json
{
  "farm_name": "Ali Eid's Farm",
  "total_animals": 5,
  "animals_by_type": {
    "sheep": 2,
    "goat": 1,
    "cow": 1,
    "camel": 1
  },
  "sacrifice_status": {
    "already_sacrificed": 1,
    "eligible_for_sacrifice": 3,
    "not_yet_eligible": 1
  },
  "care_status": {
    "recently_fed": 2,
    "recently_groomed": 1,
    "need_feeding": 3,
    "need_grooming": 4
  }
}
```

---

## Animal Management Endpoints
*All endpoints require `Authorization: Bearer {token}` header*

### List Animals
```http
GET /api/animals
GET /api/animals?search=nour   # partial match against tag or name (quick search)
```

**Response (200):**
```json
[
  {
    "id": 1,
    "type": "sheep",
    "name": "Whitey",
    "tag": "S-001",
    "breed_id": 3,
    "breed": "Sardi",
    "sex": "female",
    "age": 1.5,
    "date_of_birth": "2024-02-24",
    "date_of_purchase": null,
    "origin": "born",
    "dam_id": null,
    "sire_id": null,
    "fed_at": "2025-06-24T10:00:00.000000Z",
    "groomed_at": null,
    "sacrificed_at": null,
    "is_sacrificed": false,
    "exit_date": null,
    "exit_reason": null,
    "is_eligible": true,
    "min_age_text": "6 months",
    "birth_id": null,
    "breeding_status": "not_bred",
    "active_withdrawal": null
  }
]
```

`age`, `is_eligible`, `min_age_text`, `breeding_status` and
`active_withdrawal` are all computed by the server — never store or
derive them client-side.

- `breeding_status` is one of `not_bred` | `bred` | `pregnant` | `nursing`
  | `available`, derived from the animal's most recent breeding cycle (see
  Breeding Cycles below).
- `active_withdrawal` is `null`, or the health record currently imposing a
  meat/milk withdrawal period (the most conservative one if more than one
  is active):
  ```json
  {
    "health_record_id": 5,
    "kind": "antibiotic",
    "product": "Oxytetracycline",
    "withdrawal_until": "2026-08-25"
  }
  ```
  A withdrawal never blocks `POST /animals/{id}/sacrifice` — it's a
  warning surfaced to the frontend, not a gate.
- `birth_id` is set only for animals created by recording a birth (see
  Births below); it's cleared (never the animal itself) if that birth
  record is later deleted.

### Add Animal
```http
POST /api/animals
```
**Request Body (minimum — unchanged from before):**
```json
{
  "type": "sheep",
  "name": "Whitey",
  "age": 1.0
}
```

**Request Body (full profile — all fields below `name` are optional):**
```json
{
  "type": "sheep",
  "name": "Whitey",
  "tag": "S-001",
  "breed_id": 3,
  "sex": "female",
  "date_of_birth": "2024-02-24",
  "date_of_purchase": "2024-08-01",
  "origin": "purchased",
  "dam_id": 12,
  "sire_id": 7
}
```

Exactly one of `age` or `date_of_birth` must be supplied — `age` is
converted to a birth date server-side and is kept only for backward
compatibility with existing clients. `tag` is unique per farm (not
globally). `dam_id`/`sire_id` must reference an animal on the same farm.

**Valid Types:** `sheep`, `goat`, `cow`, `camel`
**Valid Sex:** `male`, `female`
**Valid Origin:** `born`, `purchased`

**Response (201):** same shape as the list endpoint's items.

### Get Animal Details
```http
GET /api/animals/{id}
```

**Response (200):** same shape as the list endpoint's items.

### Feed Animal
```http
POST /api/animals/{id}/feed
```

**Response (200):**
```json
{
  "id": 1,
  "fed_at": "2025-06-24T20:58:38.000000Z"
}
```

### Groom Animal
```http
POST /api/animals/{id}/groom
```

**Response (200):**
```json
{
  "id": 1,
  "groomed_at": "2025-06-24T20:58:38.000000Z"
}
```

### Sacrifice Animal
```http
POST /api/animals/{id}/sacrifice
```

**Success Response (200):**
```json
{
  "id": 1,
  "sacrificed_at": "2025-06-24T20:58:38.000000Z",
  "is_sacrificed": true,
  "exit_date": "2025-06-24",
  "exit_reason": "sacrifice"
}
```

`exit_date`/`exit_reason` generalize `sacrificed_at` to also cover death
and sale in a future phase; `sacrifice` is currently the only path that
sets them.

**Error Response (400) - Age Validation:**
```json
{
  "error": "Sheep must be at least 6 months old for sacrifice."
}
```

---

## Weight History Endpoints
*All endpoints require `Authorization: Bearer {token}` header. Animals are scoped to the caller's farm.*

### List Weight History
```http
GET /api/animals/{id}/weights
```

**Response (200)** — newest first:
```json
[
  { "id": 2, "weight_kg": 42.5, "measured_at": "2026-08-10", "notes": null },
  { "id": 1, "weight_kg": 40.0, "measured_at": "2026-08-01", "notes": "monthly check" }
]
```

### Record a Weight
```http
POST /api/animals/{id}/weights
```
**Request Body:**
```json
{
  "weight_kg": 42.5,
  "measured_at": "2026-08-10",
  "notes": "monthly check"
}
```
`notes` is optional. **Response (201):** the created entry, same shape as above.

### Update / Delete a Weight Entry
```http
PUT    /api/weights/{id}
DELETE /api/weights/{id}
```
`PUT` takes the same body as create (`weight_kg`, `measured_at`, `notes`)
and returns the updated entry. `DELETE` returns
`{ "message": "Weight record deleted" }`. Both are scoped to the caller's
farm regardless of which animal the weight belongs to.

---

## Breeding Cycle Endpoints
*All endpoints require `Authorization: Bearer {token}` header. Cycles are scoped to the caller's farm via the dam.*

Business rules: only a female animal can be bred; a dam can't have a second
open cycle (no birth yet, result still `pending`/`pregnant`) while one is
already open. Per-species timing (gestation, pregnancy-check window,
weaning age, post-weaning rest before rebreeding) lives in one place,
`BreedingCycle::SPECIES_RULES` — every `expected_*` date below is derived
from it, never entered manually.

### List a Dam's Breeding Cycles
```http
GET /api/animals/{id}/breeding-cycles
```
**Response (200)** — most recent first:
```json
[
  {
    "id": 12,
    "animal_id": 25,
    "sire_id": 26,
    "sire_name": "Ram",
    "method": "natural",
    "bred_on": "2026-01-01",
    "pregnancy_check_on": "2026-02-15",
    "pregnancy_result": "pregnant",
    "weaned_on": null,
    "notes": null,
    "status": "pregnant",
    "expected_check_on": "2026-02-15",
    "expected_lambing_on": "2026-05-28",
    "expected_weaning_on": null,
    "birth_id": null
  }
]
```
`status` is one of `bred` | `pregnant` | `not_pregnant` | `aborted` |
`lambed` (a linked birth always wins over `pregnancy_result`, since
recording a birth is itself proof of pregnancy even if a check was never
logged).

### Start a Breeding Cycle
```http
POST /api/animals/{id}/breeding-cycles
```
**Request Body:**
```json
{ "sire_id": 26, "method": "natural", "bred_on": "2026-01-01", "notes": null }
```
`sire_id` is optional and, if given, must be a male animal on the same
farm. `method` is `natural` or `ai`. **Response (201):** same shape as the
list endpoint's items, `pregnancy_result` defaults to `pending`.

### Edit a Breeding Cycle
```http
PUT /api/breeding-cycles/{id}
```
Same body as create (`sire_id`, `method`, `bred_on`, `notes`). Only these
original fields — `pregnancy_result` and `weaned_on` are only ever set via
the dedicated actions below, never through this endpoint.

### Delete a Breeding Cycle
```http
DELETE /api/breeding-cycles/{id}
```
**Response (200):** `{ "message": "Breeding cycle deleted" }`

### Record a Pregnancy Check
```http
POST /api/breeding-cycles/{id}/pregnancy-check
```
**Request Body:**
```json
{ "result": "pregnant", "checked_on": "2026-02-15" }
```
`result` is `pregnant` | `not_pregnant` | `aborted`. `checked_on` must be
between `bred_on` and today. **Response (200):** the updated cycle.

### Record a Weaning
```http
POST /api/breeding-cycles/{id}/wean
```
**Request Body:**
```json
{ "weaned_on": "2026-07-15" }
```
Requires the cycle already have a linked birth (400 otherwise);
`weaned_on` must be between the birth's `born_on` and today.
**Response (200):** the updated cycle.

---

## Birth Endpoints
*All endpoints require `Authorization: Bearer {token}` header. Births are scoped to the caller's farm via the dam.*

Recording a birth creates one real `animals` record per **live** offspring
(never for the stillborn difference between `offspring_total` and
`offspring_alive` — that's only ever a count on the birth row). Each
offspring with a `birth_weight_kg` given also gets a matching first entry
in its own weight history.

### List a Dam's Births
```http
GET /api/animals/{id}/births
```
**Response (200)** — most recent first:
```json
[
  {
    "id": 8,
    "breeding_cycle_id": 13,
    "dam_id": 29,
    "sire_id": 30,
    "sire_name": "Ram",
    "born_on": "2026-06-01",
    "offspring_total": 3,
    "offspring_alive": 2,
    "difficulty": "easy",
    "notes": null,
    "animals": [
      { "id": 31, "name": "Lamb A", "tag": null, "sex": "female" },
      { "id": 32, "name": "Lamb B", "tag": null, "sex": "male" }
    ]
  }
]
```

### Record a Birth
```http
POST /api/animals/{id}/births
```
**Request Body:**
```json
{
  "breeding_cycle_id": 13,
  "sire_id": 30,
  "born_on": "2026-06-01",
  "offspring_total": 3,
  "offspring_alive": 2,
  "difficulty": "easy",
  "notes": null,
  "offspring": [
    { "name": "Lamb A", "sex": "female", "tag": null, "birth_weight_kg": 3.2 },
    { "name": "Lamb B", "sex": "male" }
  ]
}
```
`breeding_cycle_id` and `sire_id` are both optional (a birth doesn't have
to be tied to a tracked cycle) but if `breeding_cycle_id` is given it must
belong to this dam. `offspring` must contain exactly `offspring_alive`
entries; offspring tags must be unique within the birth and not already
used elsewhere on the farm. `difficulty` is `easy` | `assisted` |
`difficult` | `cesarean` (optional). **Response (201):** same shape as the
list endpoint's items, `animals` populated with the newly created records.

### Edit a Birth
```http
PUT /api/births/{id}
```
**Request Body:** birth-level fields only — `breeding_cycle_id`, `sire_id`,
`born_on`, `offspring_total`, `offspring_alive`, `difficulty`, `notes`.
Does **not** touch the animal records already created; correcting an
individual offspring's name/sex/tag happens on that animal's own record
(`PUT /api/animals/{id}` is not yet exposed for edits — see the animal
form for creation only).

### Delete a Birth
```http
DELETE /api/births/{id}
```
**Response (200):** `{ "message": "Birth record deleted" }`

Deleting a birth **never deletes the animals it produced.** Their
`birth_id` is set to `null` (`nullOnDelete` at the database level); the
lamb/kid/calf and its own history (weights, health records) survive
untouched.

---

## Health Record Endpoints
*All endpoints require `Authorization: Bearer {token}` header. Records are scoped to the caller's farm via the animal.*

### List an Animal's Health Records
```http
GET /api/animals/{id}/health-records
```
**Response (200)** — most recent first:
```json
[
  {
    "id": 5,
    "animal_id": 29,
    "kind": "antibiotic",
    "product": "Oxytetracycline",
    "dose": "10ml",
    "administered_on": "2026-08-10",
    "next_due_on": "2026-09-10",
    "withdrawal_until": "2026-08-25",
    "cost": 45.00,
    "veterinarian": null,
    "notes": null
  }
]
```

### Add a Health Record
```http
POST /api/animals/{id}/health-records
```
**Request Body:**
```json
{
  "kind": "antibiotic",
  "product": "Oxytetracycline",
  "dose": "10ml",
  "administered_on": "2026-08-10",
  "next_due_on": "2026-09-10",
  "withdrawal_until": "2026-08-25",
  "cost": 45.00,
  "veterinarian": null,
  "notes": null
}
```
`kind` is one of `vaccine` | `antiparasitic` | `antibiotic` | `vitamin` |
`disease` | `surgery` | `injury`. Everything except `kind` and
`administered_on` is optional. **Response (201):** the created record.

### Edit / Delete a Health Record
```http
PUT    /api/health-records/{id}
DELETE /api/health-records/{id}
```
`PUT` takes the same body as create and returns the updated record.
`DELETE` returns `{ "message": "Health record deleted" }`.

---

## Alerts Endpoints
*All endpoints require `Authorization: Bearer {token}` header.*

Alerts are **computed at read time** from the farm's current data — there
is no scheduler, queue worker, or stored alert row for the alert itself
(only a dismissal, once acknowledged, is persisted). Every alert type uses
a flat 5-day lead time.

### List Current Alerts
```http
GET /api/alerts
```
**Response (200)** — soonest/most-overdue first, already excluding
anything dismissed:
```json
[
  {
    "type": "breeding_check_due",
    "key": "breeding_check_due:14",
    "animal_id": 33,
    "animal_name": "Nan",
    "animal_type": "goat",
    "due_on": "2026-08-20",
    "days_until": 3,
    "cycle_id": 14
  }
]
```
`type` is one of `breeding_check_due` | `lambing_due` | `weaning_due` |
`reinsemination_due` | `health_due`. `lambing_due` and `health_due`
responses additionally carry the fields needed to phrase them correctly
per species/kind (e.g. `health_due` includes `kind` and `product`) — the
frontend builds the sentence from these structured fields via i18next; the
API never returns a pre-rendered message string. `key` is a stable natural
key (e.g. `weaning_due:{birth_id}`, `health_due:{health_record_id}`) used
to dismiss that specific occurrence.

### Dismiss an Alert
```http
POST /api/alerts/dismiss
```
**Request Body:**
```json
{ "key": "breeding_check_due:14" }
```
**Response (200):** `{ "message": "Alert dismissed" }`. Idempotent —
dismissing an already-dismissed key is a no-op, not an error. Permanent
until the underlying record changes (there's no snooze/expiry); e.g.
logging the actual pregnancy check removes `breeding_check_due` because
the cycle it was computed from no longer matches the alert's condition.

---

## Breeds Endpoint
*Requires `Authorization: Bearer {token}` header.*

```http
GET /api/breeds
GET /api/breeds?species=sheep
```

**Response (200):**
```json
[
  { "id": 1, "species": "sheep", "name": "Sardi" },
  { "id": 2, "species": "sheep", "name": "D'man" }
]
```

Used to populate the breed dropdown on the animal form. The seeded list is
a small starting set, not exhaustive.

---

## Sacrifice Age Requirements

| Animal | Minimum Age | Arabic |
|--------|-------------|--------|
| Sheep  | 6 months (0.5 years) | الضأن - لا تقل عن 6 أشهر |
| Goat   | 1 year | الماعز - لا تقل عن سنة |
| Cow    | 2 years | البقر - لا تقل عن سنتين |
| Camel  | 5 years | الإبل - لا تقل عن خمس سنوات |

---

## Error Responses

### Authentication Errors
- `401 Unauthorized` - Invalid or missing token
- `422 Unprocessable Entity` - Validation errors

### Animal Management Errors
- `400 Bad Request` - Business logic errors (age validation, already sacrificed, etc.)
- `404 Not Found` - Animal not found or doesn't belong to user
- `422 Unprocessable Entity` - Validation errors

### Example Error Response
```json
{
  "error": "Animal not found"
}
```

### Validation Error Response
```json
{
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

---

## Architecture Improvements

### Controllers Organization
Controllers are properly organized in the `Api` namespace:
```
app/Http/Controllers/Api/
├── AuthController.php           # Authentication endpoints
├── AnimalController.php         # Animal management
├── BreedController.php          # Breed lookup
├── WeightController.php         # Weight history
├── BreedingCycleController.php  # Breeding cycles + pregnancy check/wean
├── BirthController.php          # Births (creates real animal records)
├── HealthRecordController.php   # Health records
├── AlertController.php          # Alerts (computed at read time)
└── FarmController.php           # Farm statistics & details
```

Benefits:
- ✅ **Clear separation** between API and web controllers
- ✅ **Easy versioning** - can add `Api/V1/`, `Api/V2/` later
- ✅ **Professional structure** following Laravel best practices
- ✅ **Namespace isolation** for better organization

### Form Request Validation
All endpoints use dedicated Form Request classes:
- `RegisterRequest` - User registration validation
- `LoginRequest` - User login validation  
- `AnimalRequest` - Animal creation validation

---

## Sample Data

After running `php artisan db:seed`, you can use these credentials:

**User 1:**
- Email: `ali@example.com`
- Password: `password`

**User 2:**
- Email: `ahmad@example.com`
- Password: `password`

---

## Testing with cURL

```bash
# Register user
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password","password_confirmation":"password"}'

# Login (save the token)
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get farm details
curl -X GET http://localhost:8000/api/farm \
  -H "Authorization: Bearer TOKEN"

# Get farm statistics
curl -X GET http://localhost:8000/api/farm/statistics \
  -H "Authorization: Bearer TOKEN"

# List animals
curl -X GET http://localhost:8000/api/animals \
  -H "Authorization: Bearer TOKEN"

# Add animal
curl -X POST http://localhost:8000/api/animals \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"sheep","name":"Test Sheep","age":1}'

# Feed animal (replace 1 with actual animal ID)
curl -X POST http://localhost:8000/api/animals/1/feed \
  -H "Authorization: Bearer TOKEN"

# Sacrifice animal
curl -X POST http://localhost:8000/api/animals/1/sacrifice \
  -H "Authorization: Bearer TOKEN"

# Logout
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer TOKEN"

# Start a breeding cycle (replace 1 with the dam's animal ID)
curl -X POST http://localhost:8000/api/animals/1/breeding-cycles \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"natural","bred_on":"2026-01-01"}'

# Record a pregnancy check (replace 1 with the cycle ID)
curl -X POST http://localhost:8000/api/breeding-cycles/1/pregnancy-check \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"result":"pregnant","checked_on":"2026-02-15"}'

# Record a birth with one live offspring
curl -X POST http://localhost:8000/api/animals/1/births \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"born_on":"2026-06-01","offspring_total":1,"offspring_alive":1,"offspring":[{"name":"Lamb A","sex":"female"}]}'

# Add a health record
curl -X POST http://localhost:8000/api/animals/1/health-records \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"vaccine","administered_on":"2026-08-10","next_due_on":"2026-11-10"}'

# List current alerts
curl -X GET http://localhost:8000/api/alerts \
  -H "Authorization: Bearer TOKEN"
``` 