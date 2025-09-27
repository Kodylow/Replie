# Replit Workspace Clone

## Overview
This project is a full-stack web application that replicates and extends the core functionalities of Replit's workspace interface. It offers a comprehensive development environment with multi-workspace support, AI-powered assistance, real-time collaborative editing, and advanced import capabilities. The application aims to be a functional clone and a platform for prototyping new features and workflows, built with modern web technologies. It provides a complete development environment with multi-workspace support, AI-powered development assistance, real-time collaborative editing, and advanced import capabilities.

## User Preferences
**Preferred communication style**: Simple, everyday language that's accessible to developers of all skill levels.
**Target audience**: Developers interested in modern web development patterns, Replit feature exploration, and collaborative development workflows.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18**, **Vite** for fast builds, **shadcn/ui** (based on Radix UI) for components, and **Tailwind CSS** for styling, including a dark theme. **TanStack Query** manages server state, and **Wouter** handles client-side routing. It follows a mobile-first, responsive design approach with adaptive components and touch-optimized interactions. State management utilizes TanStack Query for server state, React Context for global application state, and local component state for UI specifics.

### Backend Architecture
The backend uses **Node.js 20** with **Express.js** and **TypeScript** for robust, type-safe API development. It provides a **RESTful API** for authentication, workspace and project management, application management, import workflows, AI chat integration, template browsing, and file operations. Key components include API route definitions, database abstraction, Replit OAuth middleware, and Google Cloud Storage services.

### Data Layer Architecture
**PostgreSQL** is the primary relational database, managed with **Drizzle ORM** for type-safe operations. It employs a multi-tenant architecture with workspace-based data isolation. The schema includes core entities like `users`, `workspaces`, `projects`, `apps`, `templates`, and `chatConversations`, using UUID primary keys, timestamp tracking, JSONB columns, and array columns for flexible data storage.

### UI/UX Decisions
The application features a mobile-responsive design with native mobile navigation, touch-optimized interfaces, and responsive breakpoints. It implements a mobile-first design philosophy with dedicated mobile components, bottom tab navigation, and gesture-friendly interactions.

### Feature Specifications
*   **Workspace Management System**: Supports multi-workspace architecture (personal/team), role-based access control, team creation, and member management.
*   **Dual Project Management**: Differentiates between Traditional Projects (code repositories) and Interactive Apps (live web applications), with categorization and privacy controls.
*   **AI-Powered Development Assistant**: Integrates OpenAI GPT for interactive planning, context-aware code suggestions, architecture recommendations, and smart template suggestions.
*   **Real-Time Code Editor**: Offers multi-file editing (HTML, CSS, JavaScript, JSON), live preview, integrated AI chat, auto-save, and resizable panel layouts.
*   **Advanced Import System**: Allows importing from GitHub repositories, ZIP files, and pre-built templates, tracking import sources.
*   **Authentication & Security**: Uses Replit OAuth for authentication, PostgreSQL for session management, and enforces multi-tenant data isolation and role-based permissions.
*   **Template System**: Provides a rich library of categorized project starters with metadata and one-click cloning.

## External Dependencies
*   **Database**: `@neondatabase/serverless` (PostgreSQL client)
*   **Object Storage**: `@google-cloud/storage` (Google Cloud Storage)
*   **AI Integration**: `openai` (OpenAI GPT API)
*   **Version Control Integration**: `@octokit/rest` (GitHub API)
*   **Frontend State Management**: `@tanstack/react-query`
*   **ORM**: `drizzle-orm`
*   **UI Components**: `@radix-ui/*`, `shadcn/ui`
*   **Styling**: `tailwindcss`, `lucide-react` (icons)
*   **Animations**: `framer-motion`
*   **Build Tool**: `vite`
*   **Type Checking**: `typescript`
*   **Schema Validation**: `zod`