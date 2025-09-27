# Overview

This is a Replit Dashboard Clone - a full-stack web application that recreates the core functionality and design of Replit's project dashboard. The application allows users to create, manage, and organize coding projects with a clean, developer-focused interface. It features project creation, categorization, search functionality, and a responsive design that mirrors Replit's established design language.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
**Framework**: React 18 with TypeScript, built using Vite for fast development and optimized builds. The frontend follows a component-based architecture with shadcn/ui as the primary UI component library.

**Styling**: Tailwind CSS with a comprehensive dark theme implementation. The design system includes custom color schemes, typography scales, and spacing units that closely match Replit's visual identity. CSS variables are used for theming flexibility.

**State Management**: TanStack Query (React Query) for server state management, providing efficient data fetching, caching, and synchronization. Local component state is managed with React hooks.

**Routing**: Wouter for lightweight client-side routing, handling navigation between the home dashboard and individual project detail pages.

## Backend Architecture
**Runtime**: Node.js with Express.js server framework, configured for both development and production environments.

**API Design**: RESTful API structure with endpoints prefixed under `/api`. The server implements CRUD operations for projects with proper error handling and validation.

**Development Setup**: Vite integration for hot module replacement in development, with custom middleware for request logging and error handling.

## Data Layer
**Database**: PostgreSQL with Drizzle ORM for type-safe database interactions. The schema includes users and projects tables with appropriate relationships and constraints.

**Schema Design**: 
- Users table with username/password authentication
- Projects table with title, description, category, privacy settings, and timestamps
- Category system supporting web apps, data apps, games, general projects, and AI agents

**Data Validation**: Zod schemas for runtime type checking and API request validation, ensuring data integrity across the application.

## UI/UX Architecture
**Component Library**: Extensive use of Radix UI primitives wrapped in custom shadcn/ui components for accessibility and consistency.

**Design System**: Comprehensive design guidelines following Replit's aesthetic with defined color palettes, typography hierarchy, spacing system, and component patterns.

**Responsive Design**: Mobile-first approach with proper breakpoints and adaptive layouts for different screen sizes.

## Development Tooling
**Build System**: Vite for fast development builds and optimized production bundles with proper asset handling.

**Type Safety**: Full TypeScript implementation with strict configuration and shared types between frontend and backend.

**Code Quality**: ESLint and Prettier integration for consistent code formatting and quality enforcement.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless) for data persistence
- **Drizzle ORM**: Type-safe database toolkit for schema management and migrations

## UI Component Library
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives including dialogs, dropdowns, forms, and navigation components
- **shadcn/ui**: Pre-built component library built on top of Radix UI with consistent styling

## State Management & Data Fetching
- **TanStack Query**: Server state management for API calls, caching, and data synchronization
- **React Hook Form**: Form state management with validation integration

## Styling & Design
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography throughout the application
- **class-variance-authority**: Utility for creating component variants

## Development Tools
- **Vite**: Build tool and development server with hot module replacement
- **TypeScript**: Static type checking for enhanced developer experience
- **date-fns**: Date manipulation and formatting utilities

## Validation & Forms
- **Zod**: Schema validation library for runtime type checking
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries

## Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (prepared for authentication features)