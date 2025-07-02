# HappyFarm Frontend - React.js Application

A modern React.js frontend for the HappyFarm Eid Al Adha farm management system.

## 🚀 Features Implemented

### ✅ **Core Authentication System**
- User registration with automatic farm creation
- Secure login/logout functionality  
- JWT token-based authentication with Laravel Sanctum
- Protected routes and route guards
- Persistent authentication state

### ✅ **Modern UI/UX Design**
- Clean, responsive design with Tailwind CSS
- Mobile-first approach with full responsive layout
- Dark/light theme support ready
- Accessible components with ARIA labels
- Loading states and error handling

### ✅ **Layout & Navigation**
- Fixed header with user profile dropdown
- Collapsible sidebar navigation
- Mobile-responsive menu
- Breadcrumb navigation ready

### ✅ **Component Architecture**
- Reusable UI components (Button, Input, Card, Modal, etc.)
- Form validation with react-hook-form
- Toast notifications with react-hot-toast
- Loading spinners and error states
- Context-based state management

### ✅ **API Integration**
- Axios-based API client with interceptors
- Automatic token management
- Error handling and retry logic
- Request/response logging
- Connection to Laravel backend

### ✅ **Islamic Compliance Features**
- Animal type definitions (Sheep, Goat, Cow, Camel)
- Sacrifice eligibility rules based on Islamic requirements
- Age validation for each animal type
- Multilingual support (English/Arabic) ready

## 🏗️ **Architecture Overview**

### **Technology Stack**
- **React 18+** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling and validation
- **Axios** - HTTP client
- **Lucide React** - Modern icon library

### **Project Structure**
```
src/
├── components/           # Reusable components
│   ├── common/          # Shared components
│   │   ├── Layout/      # Layout components
│   │   ├── UI/          # Basic UI components
│   │   └── Forms/       # Form components
│   ├── auth/            # Authentication components
│   ├── animals/         # Animal management components
│   └── dashboard/       # Dashboard components
├── pages/               # Route components
├── services/            # API services
├── context/             # React context providers
├── constants/           # App constants
├── hooks/               # Custom hooks
└── styles/              # Global styles
```

### **State Management**
- **AuthContext** - User authentication and profile
- **NotificationContext** - App-wide notifications
- **React Query** - Server state and caching
- **Local Storage** - Token and user data persistence

## 🔧 **Setup & Installation**

### **Prerequisites**
- Node.js 18+ and npm
- Laravel backend running on http://localhost:8000

### **Installation**
```bash
cd happyfarm-frontend
npm install
npm run dev
```

### **Environment Variables**
Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=HappyFarm
VITE_ENVIRONMENT=development
```

## 📱 **Pages & Routes**

### **Public Routes**
- `/login` - User login page
- `/register` - User registration page

### **Protected Routes**
- `/` - Dashboard (farm overview)
- `/animals` - Animal list view
- `/animals/add` - Add new animal form
- `/animals/:id` - Animal details and actions
- `/farm` - Farm details and statistics
- `/profile` - User profile management

## 🎨 **Design System**

### **Color Palette**
- **Primary**: Green theme (#22c55e) representing nature/farm
- **Secondary**: Brown/Earth tones for warmth
- **Status Colors**: Green (healthy), Yellow (needs care), Red (attention)

### **Components**
- **Button** - Multiple variants (primary, secondary, outline, ghost)
- **Input** - Form inputs with validation styling
- **Card** - Content containers with consistent styling
- **Modal** - Dialog boxes and overlays
- **LoadingSpinner** - Loading states

### **Typography**
- **Primary Font**: Inter (modern, clean)
- **Arabic Support**: Noto Sans Arabic (RTL support ready)

## 🔐 **Security Features**

- **Token-based Authentication** - JWT tokens with Laravel Sanctum
- **Automatic Token Refresh** - Seamless session management
- **Route Protection** - Private route guards
- **Input Validation** - Client-side form validation
- **XSS Prevention** - Sanitized inputs and outputs

## 🌐 **API Integration**

### **Authentication Endpoints**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### **Farm Management**
- `GET /api/farm` - Get farm details
- `GET /api/farm/statistics` - Get farm statistics

### **Animal Management**
- `GET /api/animals` - List all animals
- `POST /api/animals` - Create new animal
- `GET /api/animals/{id}` - Get animal details
- `POST /api/animals/{id}/feed` - Feed animal
- `POST /api/animals/{id}/groom` - Groom animal
- `POST /api/animals/{id}/sacrifice` - Sacrifice animal

## 📋 **What's Ready to Use**

### ✅ **Fully Functional**
1. **User Registration & Login** - Complete authentication flow
2. **Dashboard Layout** - Header, sidebar, main content
3. **Navigation** - Responsive navigation with active states
4. **API Client** - Ready to communicate with Laravel backend
5. **Form Validation** - Real-time validation with error handling
6. **Error Handling** - Comprehensive error states and messages
7. **Loading States** - Beautiful loading indicators
8. **Responsive Design** - Mobile-first responsive layout

### 🚧 **Ready for Enhancement**
1. **Animal Management Forms** - Structure ready, needs implementation
2. **Dashboard Statistics** - Layout ready, needs API integration
3. **Animal Actions** - Feed, groom, sacrifice functionality
4. **Profile Management** - User profile editing
5. **Farm Statistics** - Detailed analytics and charts

## 🎯 **Next Steps for Full Implementation**

### **Phase 1: Core Animal Management**
1. Complete Add Animal form with validation
2. Implement Animals list with search/filter
3. Create Animal detail view with actions
4. Add feed, groom, sacrifice functionality

### **Phase 2: Enhanced UI/UX**
1. Add loading skeletons
2. Implement search and filtering
3. Add confirmation modals for actions
4. Create detailed farm statistics

### **Phase 3: Advanced Features**
1. Real-time updates
2. Offline capability
3. Export functionality
4. Advanced analytics

## 🛠️ **Development Commands**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test            # Run tests
```

## 📚 **Dependencies Overview**

### **Core Dependencies**
- `react` & `react-dom` - React framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `react-query` - Server state management
- `react-hook-form` - Form handling

### **UI & Styling**
- `tailwindcss` - CSS framework
- `lucide-react` - Icons
- `classnames` - Dynamic class names
- `react-hot-toast` - Notifications

### **Utilities**
- `date-fns` - Date manipulation
- `vite` - Build tool

## 🌟 **Key Features of Implementation**

### **Modern React Patterns**
- Functional components with hooks
- Context API for global state
- Custom hooks for reusable logic
- Error boundaries for error handling

### **Performance Optimizations**
- Code splitting ready
- Lazy loading components
- Optimized bundle size
- React Query caching

### **Accessibility**
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility

### **Islamic Compliance**
- Accurate age requirements for sacrifice
- Multilingual support (Arabic/English)
- Cultural considerations in design
- Religious validation rules

---

**Built with ❤️ for the Muslim community**

This frontend provides a solid foundation for the HappyFarm application with modern development practices, excellent user experience, and full integration capabilities with the Laravel backend. 