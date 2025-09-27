# Replit Workspace Clone

[![Built with Replit](https://img.shields.io/badge/Built%20with-Replit-orange)](https://replit.com)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue)](https://www.postgresql.org/)

A feature-complete clone of Replit's workspace interface, built for prototyping new features and exploring innovative development workflows. This project recreates the core functionality of Replit's dashboard with modern web technologies and includes AI-powered development assistance.

## 🚀 Live Demo

**[proto-replit.replit.app](https://proto-replit.replit.app)** - Experience the live prototype

## 🔄 Quick Start for Contributors

**Want to propose features or improvements?**

1. **[Remix this project →](https://replit.com/@kodylow/ReplitPrototyper?v=1)** to start your own Repl
2. Make your changes and improvements
3. Publish your version and share the link
4. Submit feedback or pull requests

## ✨ Key Features

### 🏠 **Workspace Management**
- **Multi-workspace support** - Personal and team workspaces with role-based access
- **Project organization** - Categorize projects by type (Web, Data Science, Games, AI Agents)
- **Real-time collaboration** - Team member management and permissions

### 🎨 **Modern UI/UX**
- **Mobile-responsive design** - Optimized for desktop, tablet, and mobile devices
- **Dark theme support** - Comprehensive dark mode with automatic theme switching
- **Component library** - Built with shadcn/ui for consistent, accessible design
- **Bottom navigation** - Native mobile app experience on mobile devices

### 📂 **Project & App Management**
- **Dual project types** - Traditional projects and interactive web apps
- **Template system** - Pre-built templates for rapid prototyping
- **Import capabilities** - GitHub repositories, ZIP files, and template cloning
- **Project categorization** - Organize by Web Dev, Data Science, Games, AI Agents, General

### 🤖 **AI-Powered Development**
- **Planning assistant** - AI-guided project planning with OpenAI integration
- **Code assistance** - Context-aware coding help within the editor
- **Smart suggestions** - Intelligent project setup and architecture recommendations

### ⚡ **Real-time Editor**
- **Multi-file editing** - HTML, CSS, JavaScript, and JSON file support
- **Live preview** - Instant preview of web applications
- **Chat integration** - AI assistant built into the editor
- **File management** - Object storage integration for persistent file handling

### 📥 **Import System**
- **GitHub integration** - Direct repository imports with branch selection
- **ZIP upload** - Drag-and-drop ZIP file imports with validation
- **Template cloning** - One-click project creation from templates
- **Metadata preservation** - Import source tracking and original URLs

### 🔐 **Authentication & Security**
- **Replit OAuth** - Seamless authentication with Replit accounts
- **Session management** - Secure session handling with PostgreSQL storage
- **Workspace isolation** - Multi-tenant architecture with data separation

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety across the application
- **Vite** - Fast development and optimized production builds
- **shadcn/ui** - Accessible, customizable component library
- **Tailwind CSS** - Utility-first styling with dark theme support
- **TanStack Query** - Powerful data fetching and caching
- **Wouter** - Lightweight client-side routing

### Backend
- **Node.js 20** - Modern JavaScript runtime
- **Express.js** - Fast, minimalist web framework
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Robust relational database
- **OpenAI API** - AI-powered development assistance
- **Google Cloud Storage** - Object storage for app files

### Development Tools
- **TypeScript** - Static type checking
- **ESLint & Prettier** - Code quality and formatting
- **Drizzle Kit** - Database migrations and schema management

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui component library
│   │   │   └── examples/   # Component examples and demos
│   │   ├── pages/          # Application pages/routes
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React context providers
│   │   └── lib/            # Utility functions and configurations
│   └── index.html          # HTML entry point
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database interface and implementations
│   ├── objectStorage.ts    # Object storage service
│   ├── replitAuth.ts       # Authentication middleware
│   └── vite.ts             # Vite development server integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and Zod validation
├── attached_assets/        # Static assets and documentation images
└── design_guidelines.md    # UI/UX design principles
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 20+ installed
- Access to a PostgreSQL database
- Replit account for authentication
- OpenAI API key (optional, for AI features)
- Google Cloud Storage bucket (optional, for file storage)

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (Replit OAuth)
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret

# AI Features (Optional)
OPENAI_API_KEY=your_openai_api_key

# Object Storage (Optional)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private

# Session Management
SESSION_SECRET=your_session_secret
```

### Installation Steps

1. **Clone or Remix the project**
   ```bash
   git clone https://github.com/your-repo/replit-workspace-clone.git
   cd replit-workspace-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Push the schema to your database
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:5000](http://localhost:5000) in your browser
   - The app will automatically handle both frontend and backend routing

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to database
npm run check        # TypeScript type checking
```

### Development Features

- **Hot Module Replacement** - Instant updates during development
- **Type Safety** - Full TypeScript coverage with strict mode
- **Database Migrations** - Safe schema updates with Drizzle Kit
- **Automatic Restarts** - Server automatically restarts on changes

### Code Organization

- **Shared types** - Database schemas and types in `shared/schema.ts`
- **API routes** - RESTful endpoints in `server/routes.ts`
- **Component library** - Reusable UI components in `client/src/components/`
- **Page components** - Route-specific components in `client/src/pages/`

## 🎯 Core Features Deep Dive

### Workspace System
The application supports both personal and team workspaces:
- **Personal workspaces** - Individual development environments
- **Team workspaces** - Collaborative spaces with member management
- **Role-based access** - Owner, admin, and member permissions

### Project Types
Two distinct project types serve different use cases:
- **Projects** - Traditional code repositories with version control metadata
- **Apps** - Interactive web applications with live editing capabilities

### Mobile Experience
Optimized mobile interface includes:
- **Bottom navigation** - Native mobile app navigation pattern
- **Touch-optimized UI** - Large touch targets and gesture support
- **Responsive layouts** - Adaptive design for all screen sizes

### AI Integration
OpenAI-powered features enhance the development experience:
- **Project planning** - Interactive planning sessions with AI guidance
- **Code assistance** - Context-aware help within the editor
- **Smart templates** - AI-suggested project structures and boilerplates

## 🚀 Deployment

### Production Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - Configure database connection
   - Set up object storage
   - Configure authentication secrets

3. **Start the production server**
   ```bash
   npm start
   ```

### Replit Deployment
This project is optimized for deployment on Replit:
- **Automatic setup** - Environment variables managed by Replit
- **Built-in database** - PostgreSQL provided by Replit
- **Object storage** - Google Cloud Storage integration
- **Authentication** - Replit OAuth built-in

## 🤝 Contributing

We welcome contributions! This project is designed to be a playground for exploring new Replit features and improvements.

### Quick Contribution Guide

1. **[Remix the project](https://replit.com/@kodylow/ReplitPrototyper?v=1)** on Replit
2. **Make your changes** - Add features, fix bugs, or improve UX
3. **Test thoroughly** - Ensure your changes work across devices
4. **Share your work** - Publish your Repl and share the link
5. **Submit feedback** - Open issues or start discussions

### Development Setup
See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines, code conventions, and architecture patterns.

## 📚 Documentation

- **[Contributing Guide](./CONTRIBUTING.md)** - Detailed development guidelines
- **[Architecture Overview](./replit.md)** - System architecture and feature documentation
- **[Design Guidelines](./design_guidelines.md)** - UI/UX design principles and patterns

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Verify database URL format
echo $DATABASE_URL

# Test database connection
npm run db:push
```

**Build Errors**
```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript types
npm run check
```

**Authentication Problems**
- Verify Replit OAuth credentials in environment variables
- Ensure session secret is set and persistent
- Check that the application URL matches OAuth settings

### Getting Help

- **Issues** - Report bugs or request features via GitHub issues
- **Discussions** - Join community discussions about new features
- **Replit Community** - Share your improvements with the Replit community

## 📄 License

MIT License - Feel free to use this project as inspiration for your own Replit features and improvements.

## 🙏 Acknowledgments

- **Replit Team** - For creating an amazing development platform
- **shadcn** - For the excellent UI component library
- **Vercel** - For inspiring modern web development patterns
- **Open Source Community** - For the countless libraries that make this possible

---

**Ready to start contributing?** [Remix this project →](https://replit.com/@kodylow/ReplitPrototyper?v=1) and start building your ideas!