# Technical Documentation: BINGO System

## 1. Introduction
This document serves as the comprehensive technical reference for the **BINGO** (Bill of Quantities) application. It details the architectural decisions, component interactions, data schemas, and deployment strategies required to maintain and extend the system.

## 2. Technology Stack Strategy

The system is built on a modern, typed stack designed for scalability, maintainability, and developer experience.

### 2.1. Frontend Ecosystem
*   **Core Framework**: **React 18** - Enables a component-based architecture with complex state management.
*   **Build System**: **Vite** - Selected for its superior build performance (ESBuild under the hood) and fast Hot Module Replacement (HMR).
*   **Language**: **TypeScript 5.3** - Enforces type safety across the application, significantly reducing runtime errors and improving code discoverability.
*   **Styling**: **Vanilla CSS / CSS Modules** - Provides granular control over styling without the overhead of runtime-in-JS libraries.
*   **State Management**: **React Context API** - efficiently manages global application state (User Context, Application Settings) without external dependencies like Redux.

### 2.2. Backend & Infrastructure (Serverless)
The backend is completely serverless, managed via **AWS Amplify**.
*   **Authentication**: **Amazon Cognito**
    *   Manages User Pools and Identity Pools.
    *   Handles JWT token rotation and secure session storage.
*   **Data Persistence**: **Amazon DynamoDB**
    *   NoSQL database design for flexible data modeling.
    *   Single-table design patterns optimized for quick lookups by ID and Email.
*   **API Layer**: **Amplify DataStore / AppSync**
    *   Provides a GraphQL interface for data operations.
    *   Offers built-in offline capabilities and conflict resolution.

### 2.3. AI Services
*   **Provider**: **Google Gemini (Generative AI)**
*   **Integration**: Direct integration via `@google/generative-ai` SDK.
*   **Usage**: The system sends engineered prompts containing room metadata to the model, which returns structured JSON arrays of equipment.

## 3. Application Architecture

### 3.1. Directory Structure
The codebase follows a feature-based modular pattern:

```bash
src/
├── components/          # UI Component Library
│   ├── admin/           # Admin-specific views (User List, Logs)
│   ├── dashboard/       # Project management views
│   ├── room/            # Core BOQ editor implementations
│   └── shared/          # Atomic components (Buttons, Inputs, Modals)
├── services/            # Business Logic & API Abstractions
│   ├── geminiService.ts # AI Prompt Engineering & API Handling
│   ├── userDefs.ts      # User Management Service
│   └── logger.ts        # Activity Logging Service
├── styles/              # Global variables and resets
└── types.ts             # Centralized Type Definitions (Single Source of Truth)
```

### 3.2. Data Architecture

#### 3.2.1. Entity Relationships
*   **User** (1) --- (Many) ---> **Activity Logs**
*   **User** (1) --- (Many) ---> **Projects** (Implicit ownership)
*   **Room** (1) --- (1) ---> **BOQ** (Bill of Quantities)

#### 3.2.2. Core Data Models (`src/types.ts`)

**User Entity (`AppUser`)**
Defines system actors with role-based attributes.
```typescript
interface AppUser {
  id: string;          // UUID v4
  email: string;       // Primary identifier for logging
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;   // ISO 8601
}
```

**Activity Log Entity (`ActivityLog`)**
Immutable record of system events for auditing.
```typescript
interface ActivityLog {
  id: string;
  action: ActivityAction; // Strong typed Enum (e.g., 'EXPORT_BOQ')
  details: Record<string, any>; // Flexible payload for event metadata
  ipAddress?: string;
  userAgent?: string;
}
```

## 4. Security & Compliance

### 4.1. Access Control
*   **Frontend**: `AuthGate.tsx` serves as a higher-order component (HOC) that wraps protected routes. It checks:
    1.  Is the user authenticated?
    2.  Is the user status `ACTIVE`?
    3.  Does the user have the required `role` for the route?
*   **Backend**: AWS IAM roles restrict DynamoDB access. Using Cognito groups to map to IAM policies is recommended for production.

### 4.2. Data Privacy
*   **Logging**: Sensitive data (passwords) is never logged.
*   **Isolation**: The `fetchActivityLogs` service automatically filters results based on the requester's role (Admins see all; Users see self).

## 5. Development workflows

### 5.1. Setup
1.  **Clone Repository**: `git clone ...`
2.  **Dependencies**: `npm install` (Ensure Node.js v18+)
3.  **Environment**: 
    *   Configure `amplify pull` to sync backend config.
    *   Set `VITE_GEMINI_API_KEY` in `.env.local`.

### 5.2. Build & Optimization
The `npm run build` command triggers `tsc` (TypeScript Compiler) for type checking followed by `vite build`. The output is a highly optimized, minified bundle in the `dist/` directory, ready for CDN deployment (e.g., AWS CloudFront).

### 5.3. Error Handling
*   **Global**: AppWrapper catches unhandled promise rejections.
*   **Service Level**: All API calls (Gemini, DynamoDB) are wrapped in `try-catch` blocks with standardized error logging to the console and Activity Log.
