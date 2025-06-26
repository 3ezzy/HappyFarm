# Eid Al Adha Farm Backend API

A Laravel-based REST API for managing the Eid Al Adha sacrifice process. Users can register, manage their farms, and handle animals (add, feed, groom, sacrifice) with proper age validation rules.

## Features

- **User Authentication**: Registration and login with Laravel Sanctum
- **Automatic Farm Creation**: Each user gets their own farm upon registration
- **Animal Management**: Add, feed, groom, and sacrifice animals
- **Age Validation**: Islamic sacrifice eligibility rules enforcement
- **Secure API**: Token-based authentication with proper authorization
- **Form Request Validation**: Clean, reusable validation using Laravel Form Requests

## Requirements

- PHP 8.2 or higher
- Composer
- SQLite (included) or MySQL
- Laravel 12

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HappyFarm
```

2. Install dependencies:
```bash
composer install
```

3. Set up environment:
```bash
cp .env.example .env
php artisan key:generate
```

4. Run migrations:
```bash
php artisan migrate
```

5. Start the development server:
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## Architecture & Best Practices

### Form Request Classes
The API uses Laravel Form Request classes for clean, reusable validation:

- **`RegisterRequest`** - User registration validation with custom messages
- **`LoginRequest`** - User login validation  
- **`AnimalRequest`** - Animal creation/update validation with type checking

Benefits:
- ✅ **Separation of Concerns** - Validation logic separated from controllers
- ✅ **Reusability** - Request classes can be reused across controllers
- ✅ **Custom Messages** - Tailored error messages for better UX
- ✅ **Cleaner Controllers** - Controllers focus on business logic
- ✅ **Centralized Validation** - Easy to maintain and update rules

### Security Features
- **Sanctum Authentication** - Token-based API authentication
- **User Authorization** - Users can only access their own data
- **Input Validation** - All inputs validated with comprehensive rules
- **CSRF Protection** - Enabled for state-changing requests

## API Endpoints

### Authentication

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "Ali Eid",
  "email": "ali@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

**Response:**
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
  "token": "SANCTUM_TOKEN"
}
```

#### Login User
```http
POST /api/login
Content-Type: application/json

{
  "email": "ali@example.com",
  "password": "password"
}
```

### Animal Management
All animal endpoints require authentication: `Authorization: Bearer YOUR_TOKEN`

#### List Animals
```http
GET /api/animals
Authorization: Bearer YOUR_TOKEN
```

#### Add Animal
```http
POST /api/animals
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "type": "sheep",
  "name": "Whitey",
  "age": 2
}
```

**Animal Types:** `sheep`, `goat`, `cow`, `camel`

#### Get Animal Details
```http
GET /api/animals/{id}
Authorization: Bearer YOUR_TOKEN
```

#### Feed Animal
```http
POST /api/animals/{id}/feed
Authorization: Bearer YOUR_TOKEN
```

#### Groom Animal
```http
POST /api/animals/{id}/groom
Authorization: Bearer YOUR_TOKEN
```

#### Sacrifice Animal
```http
POST /api/animals/{id}/sacrifice
Authorization: Bearer YOUR_TOKEN
```

## Sacrifice Age Requirements

The API enforces Islamic sacrifice eligibility rules:

| Animal | Minimum Age | Arabic |
|--------|-------------|---------|
| Sheep  | 6 months    | الضأن (غنم) - لا تقل عن 6 أشهر |
| Goat   | 1 year      | الماعز - لا تقل عن سنة |
| Cow    | 2 years     | البقر - لا تقل عن سنتين |
| Camel  | 5 years     | الإبل - لا تقل عن خمس سنوات |

## Error Responses

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (e.g., animal already sacrificed, not eligible)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (animal or resource not found)
- `422` - Validation Error (invalid input data)

Example error response:
```json
{
  "error": "Sheep must be at least 6 months old for sacrifice."
}
```

## Database Schema

### Users
- `id` - Primary key
- `name` - User's full name
- `email` - User's email (unique)
- `password` - Hashed password
- `created_at`, `updated_at` - Timestamps

### Farms
- `id` - Primary key
- `user_id` - Foreign key to User
- `name` - Farm name (auto: "{user}'s Farm")
- `created_at`, `updated_at` - Timestamps

### Animals
- `id` - Primary key
- `farm_id` - Foreign key to Farm
- `type` - Enum: 'sheep', 'goat', 'cow', 'camel'
- `name` - Animal's name or tag
- `age` - Age in years (decimal for months)
- `fed_at` - Last feeding timestamp
- `groomed_at` - Last grooming timestamp
- `sacrificed_at` - Sacrifice timestamp
- `is_sacrificed` - Boolean flag
- `created_at`, `updated_at` - Timestamps

## Security

- **Authentication**: Laravel Sanctum token-based authentication
- **Authorization**: Users can only access their own farm and animals
- **Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Laravel's default API rate limiting applied

## Testing

You can test the API using tools like Postman, curl, or any HTTP client:

```bash
# Register a user
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password","password_confirmation":"password"}'

# Add an animal (use token from registration)
curl -X POST http://localhost:8000/api/animals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"sheep","name":"Test Sheep","age":1}'
```

## Development

- Built with Laravel 12
- Uses Laravel Sanctum for API authentication
- SQLite database (can be changed to MySQL)
- Follows RESTful API conventions
- Implements proper error handling and validation
- **Form Request Classes** for clean, maintainable validation
- Comprehensive test coverage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open-sourced software licensed under the MIT license.
