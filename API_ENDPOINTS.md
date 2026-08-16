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
    "min_age_text": "6 months"
  }
]
```

`age`, `is_eligible` and `min_age_text` are computed by the server from
`date_of_birth` and the animal's `type` — never store or derive them
client-side.

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
├── AuthController.php    # Authentication endpoints
├── AnimalController.php  # Animal management
├── BreedController.php   # Breed lookup
├── WeightController.php  # Weight history
└── FarmController.php    # Farm statistics & details
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
``` 