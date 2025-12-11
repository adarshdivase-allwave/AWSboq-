# technical documentation: BINGO

## 1. Introduction
This document details the technical implementation of BINGO, including the technology stack, codebase structure, data models, and deployment procedures. It is intended for developers maintaining or extending the system.

## 2. Technology Stack

### 2.1. Frontend
- **Framework**: React 18
- **Build Tool**: Vite (offering fast HMR and optimized builds)
- **Language**: TypeScript 5.3 (ensuring type safety)
- **Styling**: Vanilla CSS with localized module patterns
- **State Management**: React Context & Hooks

### 2.2. Backend & Cloud (AWS Amplify)
- **Authentication**: Amazon Cognito (User Pools & Identity Pools)
- **Database**: Amazon DynamoDB (NoSQL database for high scalability)
- **API**: AWS AppSync / Amplify DataStore (GraphQL-based data interaction)

### 2.3. AI Integration
- **Service**: Google Gemini (Custom Generative AI models)
- **SDK**: `@google/generative-ai`
- **Function**: Processes unstructured room data to output structured BOQ items (category, description, price estimates).

## 3. Codebase Structure

```bash
BINGO/
├── amplify/                  # AWS Amplify backend configuration
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AdminDashboard.tsx# User & Log management interface
│   │   ├── AppWrapper.tsx    # Main context provider
│   │   ├── AuthGate.tsx      # Security wrapper for protected routes
│   │   └── ...
│   ├── services/             # Logic & API layers
│   │   ├── geminiService.ts  # Integration with Google Gemini API
│   │   ├── userManagement.ts # Admin operations (CRUD users)
│   │   └── ...
│   ├── types.ts              # Global TypeScript interfaces
│   ├── App.tsx               # Main application router/layout
│   └── main.tsx              # Entry point
├── package.json              # Dependencies & Scripts
└── vite.config.ts            # Vite configuration
```

## 4. Key Data Models (`src/types.ts`)

### 4.1. User (`AppUser`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique User ID |
| `email` | string | User's email address |
| `role` | `ADMIN` / `USER` | Permissions level |
| `status` | `ACTIVE` / `INACTIVE` | Account state |

### 4.2. Activity Log (`ActivityLog`)
| Field | Type | Description |
|-------|------|-------------|
| `action` | Enum | e.g., `LOGIN`, `EXPORT_BOQ` |
| `userId` | string | ID of the actor |
| `details` | JSON | Metadata about the event |
| `timestamp` | ISO String | When the event occurred |

### 4.3. BOQ Item (`BoqItem`)
Core unit of the application.
```typescript
interface BoqItem {
  category: string;       // e.g., "Video"
  itemDescription: string;// e.g., "65 inch 4K Display"
  quantity: number;
  unitPrice: number;
  totalPrice: number;     // Calc: quantity * unitPrice
  source: 'database' | 'web';
}
```

## 5. Setup & Development

### 5.1. Prerequisites
- Node.js (v18+)
- Active AWS Account (for Amplify)
- Google Cloud API Key (for Gemini)

### 5.2. Environment Variables
Create a `.env.local` file:
```env
VITE_GEMINI_API_KEY=your_key_here
```

### 5.3. Installation & Running
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 5.4. Build for Production
```bash
npm run build
# Output located in /dist
```

## 6. Security Implementation
- **Role-Based Access Control (RBAC)**: Implemented in `AuthGate.tsx`. Non-admin users are physically prevented from accessing `/admin` routes.
- **Data Isolation**: Application logic filters logs so standard users only see their own history, while Admins see all.
- **Audit Logging**: Critical actions (Login, Export, User Changes) are immutable records in the `ActivityLog` table.
