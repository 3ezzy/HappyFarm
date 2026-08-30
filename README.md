# Happy Farm — Eid Al Adha Farm Management System

Happy Farm is a full-stack web application designed to help users manage animals and farm activities related to Eid Al Adha.

The application provides animal management, breeding and birth tracking, health records, weight history, inventory management, farm reporting, alerts, user approval, administrative controls, and secure authentication.

The project consists of a Laravel REST API backend and a React frontend.

## ✨ Features

### 🐑 Animal Management

- Add, edit, view, archive, and manage animals
- Support for:
  - Sheep
  - Goats
  - Cows
  - Camels
- Unique animal tags per farm
- Breed management
- Sex and origin tracking
- Date of birth instead of manually maintained age
- Automatic age calculation
- Purchase date tracking
- Parent relationships:
  - Dam (mother)
  - Sire (father)
- Animal exit tracking
- Soft-delete/archive support
- Historical animal relationships remain intact after archival or exit

### 📋 Animal Validation

The system validates:

- Species compatibility
- Parent sex
- Parent maturity
- Parent availability
- Archived animals
- Exited animals
- Self-parent relationships
- Origin and purchase-date consistency

For example:

- Animals marked as **Born on farm** cannot have a purchase date.
- A purchase date is optional for purchased animals — the backend only rejects the combination of "born on farm" with a purchase date.
- Parents must belong to the same species.
- A dam must be female.
- A sire must be male.
- Immature, archived, or exited animals cannot be selected for new breeding relationships.

### 🐄 Islamic Sacrifice Eligibility

Happy Farm enforces minimum age requirements for Eid Al Adha sacrifice.

| Animal | Minimum Age |
|--------|-------------|
| Sheep  | 6 months    |
| Goat   | 1 year      |
| Cow    | 2 years     |
| Camel  | 5 years     |

The system automatically calculates animal age from `date_of_birth` and validates eligibility before sacrifice.

### ⚖️ Weight Tracking

Each animal can have a complete weight history.

Features include:

- Add weight records
- View historical weights
- Edit weight records
- Delete weight records
- Track birth weight
- Monitor animal growth over time

### ❤️ Breeding Management

The breeding system supports breeding cycles for all supported animal species.

Each breeding cycle can track:

- Dam
- Sire
- Breeding method
- Breeding date
- Pregnancy check
- Pregnancy result
- Expected birth date
- Weaning date

Supported breeding methods:

- Natural breeding
- Artificial insemination

Species-specific breeding rules are used to calculate important dates such as pregnancy checks, gestation, and weaning.

Animals must meet eligibility requirements before being used in breeding.

### 🐣 Birth Management

The application allows users to record births and offspring.

Birth records include:

- Dam
- Sire
- Birth date
- Total offspring
- Living offspring
- Birth difficulty

Offspring can be linked directly to their birth record.

Birth validation ensures:

- Parent compatibility
- Correct species
- Valid parent relationships
- Historical relationships remain valid

### 🏥 Health Records

Users can maintain health records for animals.

Supported record types include:

- Vaccinations
- Antiparasitic treatments
- Antibiotics
- Vitamins
- Disease treatment
- Surgery
- Injury treatment

Health records can be used to track the health history of each animal.

### 📦 Inventory Management

Farms can track feed, medicine, and other supplies with a simple stock ledger.

Features include:

- Add, rename, and delete farm-scoped inventory items (e.g. feed, medicine, supplies)
- Each item has a unit (kg, bags, liters, etc.) and an optional low-stock threshold
- Append-only transaction ledger — every change is a **restock** or **consume** entry
- Current stock is always derived from the transaction history, not stored directly
- A consume transaction that would take stock negative is rejected
- Full transaction history per item, newest first
- Items with recorded transactions cannot be deleted, to preserve the ledger

### 📈 Farm Reports & Statistics

A reporting dashboard gives an overview of the farm's activity, scoped to the authenticated user's own farm.

Includes:

- Expense summary — total spend, grouped by kind, and broken down by month (last 6 months)
- Breeding performance — total births, total live offspring, weaning rate
- Current breeding status counts across the flock
- Open alerts summary across all alert types
- Per-animal weight-trend chart

### 🔔 Alerts

The system provides alerts for important farm events.

Alerts can include:

- Breeding-related events
- Pregnancy checks
- Expected births
- Weaning periods
- Health-related reminders
- Low-stock inventory alerts
- Other time-sensitive farm activities

Users can dismiss alerts at the farm level.

The frontend provides an alerts interface through the application header.

### 👤 Authentication

Happy Farm uses Laravel Sanctum for secure token-based authentication.

Features include:

- User registration
- Login
- Logout
- Protected API routes
- Password reset
- Token revocation
- Role-based access control

### 📝 User Registration and Approval

New users can register normally, but newly registered accounts are not automatically allowed to log in.

Registration flow:

```
Register
   ↓
Pending
   ↓
Admin Review
   ├── Approve → User can log in
   │
   └── Reject → User cannot log in
```

When a user registers:

- Their account is created with `pending` status.
- Their farm is created automatically.
- No authentication token is issued.
- The user must wait for administrator approval.

Existing users are preserved as `approved` during the migration.

### 👑 Roles

The system currently supports two roles:

- `user`
- `admin`

**User**

A regular user can:

- Manage their own farm
- Manage their animals
- Manage breeding cycles
- Record births
- Track weights
- Manage inventory
- View farm reports
- Manage health records
- View alerts

**Admin**

An administrator can:

- View users across all farms
- Filter users by status
- Approve pending users
- Reject pending users
- Suspend approved users
- Reactivate suspended users

### 🛡️ User Status Management

The application supports the following account statuses:

- `pending`
- `approved`
- `rejected`
- `suspended`

Account lifecycle:

```
                    ┌───────────┐
                    │  Pending  │
                    └─────┬─────┘
                     ┌────┴────┐
                     ▼         ▼
                Approved    Rejected
                     │
                     ▼
                 Suspended
                     │
                     ▼
                 Approved
```

**Pending** — The account is waiting for administrator approval.

**Approved** — The user can log in and access the application.

**Rejected** — The registration request was denied. Rejected accounts cannot log in.

**Suspended** — The account temporarily loses access.

When an account is suspended:

- All Sanctum tokens are revoked.
- All active sessions lose API access.
- The user cannot log in.
- Access can later be restored by an administrator.

When reactivated:

- The account returns to `approved`.
- The user must log in again to receive a new token.

### 🔐 Password Reset

Happy Farm includes a complete Forgot/Reset Password flow, built on Laravel's password broker.

**Forgot Password**

Users can request a password reset link.

For security, the API always returns the same generic success message regardless of whether the email exists. This prevents email enumeration attacks.

**Reset Password**

Users can reset their password using a secure token.

Password requirements:

- Minimum 8 characters
- Password confirmation required
- Valid reset token required

After a successful password reset, all existing Sanctum tokens are revoked. This means previously authenticated devices immediately lose access and must log in again. This never changes the account's `status` or `role` — a suspended, pending, or rejected account remains exactly that after resetting its password.

### 📧 Email Delivery

Password reset emails are sent through the Brevo Transactional Email API using a custom Laravel mail transport (`App\Mail\Transport\BrevoApiTransport`) — not SMTP.

Configuration example:

```
MAIL_MAILER=brevo

BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_verified_sender@example.com
BREVO_FROM_NAME="Happy Farm"

FRONTEND_URL=http://localhost:3000
```

The Brevo API key must never be committed to Git — it is read from `.env` only.

If Brevo IP authorization is enabled on your account, the server's public IP must be added to Brevo's authorized IP list, or every send will fail with a `401 unauthorized` even with a valid key.

### 🖥️ Admin Dashboard

The Admin Dashboard is available only to users with the `admin` role.

Admin features include:

- View all registered users
- Cross-farm user visibility
- Filter users by: Pending, Approved, Rejected, Suspended
- Approve users
- Reject users
- Suspend accounts
- Reactivate accounts

The frontend role checks are only for user experience. The actual security boundary is enforced by backend middleware.

### 🔒 Security

The application includes several security mechanisms.

**Authentication**

- Laravel Sanctum
- Token-based authentication
- Protected API routes

**Authorization**

- Farm data is scoped to the authenticated user.
- Admin routes require the `admin` role.
- Normal users cannot access administrative endpoints.

**Input Validation**

Laravel Form Requests are used to validate application input. Examples include:

- Registration validation
- Login validation
- Animal creation
- Animal updates
- Birth records
- Breeding cycles
- Password reset requests

**Account Protection**

- Pending users cannot log in.
- Rejected users cannot log in.
- Suspended users cannot log in.
- Suspension revokes all existing tokens.
- Password reset revokes all existing tokens.
- An admin cannot suspend their own account.

**Password Reset Protection**

- Generic responses prevent email enumeration.
- Reset tokens are validated by Laravel's password broker.
- Reset tokens cannot be reused.
- Expired tokens are rejected.
- Password reset routes are rate-limited.

### 🌍 Internationalization

The frontend supports three languages:

- 🇬🇧 English
- 🇫🇷 French
- 🇸🇦 Arabic

Translations are maintained across all supported locales, with full key parity enforced.

## 🏗️ Technology Stack

**Backend**

- PHP 8.2+
- Laravel 12
- Laravel Sanctum
- PostgreSQL
- Laravel Password Broker

**Frontend**

- React 18
- Vite
- Tailwind CSS
- React Query
- React Router
- react-i18next / i18next
- Axios
- Recharts (reporting charts)
- React Hot Toast (notifications)

**Email**

- Brevo Transactional Email API

## 📁 Project Architecture

```
HappyFarm/
│
├── app/
│   ├── Console/           # Artisan commands (e.g. user:make-admin)
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/    # e.g. EnsureUserIsAdmin
│   │   └── Requests/      # Form Request validation classes
│   ├── Mail/
│   │   └── Transport/     # BrevoApiTransport (custom mail transport)
│   ├── Models/
│   ├── Providers/
│   └── Services/          # e.g. AlertGenerator
│
├── config/
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
│
├── routes/
│   └── api.php
│
├── tests/
│   ├── Feature/
│   └── Unit/
│
├── happyfarm-frontend/
│   └── src/
│       ├── components/
│       ├── context/        # AuthContext
│       ├── i18n/
│       │   └── locales/    # en.json, fr.json, ar.json
│       ├── pages/
│       ├── services/
│       │   └── api/
│       ├── theme/
│       └── utils/
│
└── README.md
```

The Laravel backend lives at the repository root; the React app lives in `happyfarm-frontend/`.

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd HappyFarm
```

### 2. Install Backend Dependencies

```bash
composer install
```

### 3. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

Configure your database and mail settings in `.env` (see [Email Delivery](#-email-delivery) above for the Brevo configuration).

Example PostgreSQL configuration:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=happy_farm
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 4. Run Migrations

```bash
php artisan migrate
```

Optionally seed demo data (a demo farm, sample animals, and breeds):

```bash
php artisan db:seed
```

### 5. Start Backend

```bash
php artisan serve
```

The API will run at:

```
http://localhost:8000
```

### Frontend Installation

Navigate to the frontend directory:

```bash
cd happyfarm-frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will typically run on:

```
http://localhost:3000
```

## 🔌 API Overview

### Authentication

```
POST /api/register
POST /api/login
POST /api/logout
PUT  /api/user/password

POST /api/forgot-password
POST /api/reset-password
```

### Current User

```
GET /api/user
```

### Farm

```
GET /api/farm
PUT /api/farm
GET /api/farm/statistics
```

### Animals

```
GET    /api/animals
POST   /api/animals
GET    /api/animals/{id}
PUT    /api/animals/{id}
DELETE /api/animals/{id}
```

Additional animal-related endpoints support restoring archived animals, recording an exit, feeding, grooming, and sacrifice.

### Weights

```
GET    /api/animals/{id}/weights
POST   /api/animals/{id}/weights
PUT    /api/weights/{id}
DELETE /api/weights/{id}
```

### Breeds

```
GET    /api/breeds
POST   /api/breeds
PUT    /api/breeds/{id}
DELETE /api/breeds/{id}
```

### Breeding

```
GET    /api/animals/{id}/breeding-cycles
POST   /api/animals/{id}/breeding-cycles
PUT    /api/breeding-cycles/{id}
DELETE /api/breeding-cycles/{id}
POST   /api/breeding-cycles/{id}/pregnancy-check
POST   /api/breeding-cycles/{id}/wean
```

### Births

```
GET    /api/animals/{id}/births
POST   /api/animals/{id}/births
PUT    /api/births/{id}
DELETE /api/births/{id}
```

### Health Records

```
GET    /api/animals/{id}/health-records
POST   /api/animals/{id}/health-records
PUT    /api/health-records/{id}
DELETE /api/health-records/{id}
```

### Alerts

```
GET  /api/alerts
POST /api/alerts/dismiss
```

### Inventory

```
GET    /api/inventory-items
POST   /api/inventory-items
PUT    /api/inventory-items/{id}
DELETE /api/inventory-items/{id}
GET    /api/inventory-items/{id}/transactions
POST   /api/inventory-items/{id}/transactions
```

### Admin

```
GET  /api/admin/users
POST /api/admin/users/{id}/approve
POST /api/admin/users/{id}/reject
POST /api/admin/users/{id}/suspend
POST /api/admin/users/{id}/reactivate
```

All admin routes require: authentication + `admin` role.

## 🧪 Testing

Run backend tests:

```bash
php artisan test
```

At the latest completed version:

- 235 tests passing
- 0 failures

Frontend checks:

```bash
npm run build
npm run lint
```

The project currently maintains clean production builds and ESLint validation.

## 🧩 Development Principles

The project follows several development practices:

- RESTful API design
- Form Request validation
- Separation of concerns
- Role-based authorization
- Server-side authorization enforcement
- Soft deletion where historical data must be preserved
- Token revocation for security-sensitive actions
- Regression testing
- Internationalization parity across supported languages

## 📈 Project Evolution

The application was developed iteratively through multiple phases.

**Phase 1**

- Expanded animal schema
- Breed management
- Date of birth migration
- Weight history
- Frontend i18n
- UI modernization

**Phase 2**

- Breeding cycles
- Birth management
- Health records
- Alerts
- Weight editing and deletion

**Phase 3**

- Farm settings (rename farm)
- Change password (profile)
- Farm reports & statistics dashboard
- Per-animal weight-trend charts
- Inventory management (items + restock/consume ledger)
- Low-stock alerts

**Phase 4**

- Parent eligibility validation
- Origin/purchase-date validation
- User approval workflow
- Roles and account statuses
- Admin dashboard
- Approve/reject workflow
- Suspend/reactivate workflow
- Token revocation

**Password Reset Feature**

- Forgot password
- Reset password
- Laravel Password Broker
- Brevo Transactional Email API
- Password reset token validation
- Sanctum token revocation
- Full EN/FR/AR support

## 🤝 Contributing

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes.
3. Run the test suite.
   ```bash
   php artisan test
   ```
4. Run frontend checks.
   ```bash
   npm run build
   npm run lint
   ```
5. Submit a pull request.

## 📄 License

This repository does not currently include a `LICENSE` file. If this project is intended to be released under the MIT License (or another license), add the corresponding `LICENSE` file to the repository root.
