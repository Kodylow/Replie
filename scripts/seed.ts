#!/usr/bin/env tsx

import { storage } from '../server/storage';
import type { InsertUser, InsertWorkspace, InsertProject, InsertApp, InsertTemplate, InsertWorkspaceMember } from '../shared/schema';

// Sample user data
const SAMPLE_USERS: InsertUser[] = [
  {
    id: 'user1',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Johnson',
    bio: 'Full-stack developer and React enthusiast',
    profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b02e8a7e?w=400'
  },
  {
    id: 'user2', 
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    bio: 'DevOps engineer with expertise in cloud infrastructure',
    profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
  },
  {
    id: 'user3',
    email: 'carol@example.com', 
    firstName: 'Carol',
    lastName: 'Williams',
    bio: 'Data scientist and machine learning researcher',
    profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
  },
  {
    id: 'user4',
    email: 'david@example.com',
    firstName: 'David',
    lastName: 'Chen',
    bio: 'Mobile app developer and UI/UX designer',
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
  },
  {
    id: 'user5',
    email: 'eva@example.com',
    firstName: 'Eva',
    lastName: 'Rodriguez',
    bio: 'Backend engineer specializing in microservices',
    profileImageUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400'
  }
];

// Sample workspace data (2 teams + personal)
const SAMPLE_WORKSPACES: InsertWorkspace[] = [
  {
    name: 'TechCorp',
    type: 'team',
    slug: 'techcorp',
    description: 'Building the future of technology',
    avatarUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'
  },
  {
    name: 'StartupLab',
    type: 'team', 
    slug: 'startuplab',
    description: 'Innovative startup incubator workspace',
    avatarUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400'
  }
];

// Sample project templates
const SAMPLE_PROJECTS = {
  web: [
    {
      title: 'E-commerce Dashboard',
      description: 'Modern admin dashboard for managing online stores',
      backgroundColor: 'bg-gradient-to-br from-blue-500 to-purple-600'
    },
    {
      title: 'Social Media App',
      description: 'Real-time social networking platform with chat',
      backgroundColor: 'bg-gradient-to-br from-pink-500 to-red-500'
    },
    {
      title: 'Portfolio Website',
      description: 'Responsive portfolio site with animations',
      backgroundColor: 'bg-gradient-to-br from-green-400 to-blue-500'
    },
    {
      title: 'Task Management Tool',
      description: 'Collaborative project management application',
      backgroundColor: 'bg-gradient-to-br from-purple-400 to-pink-500'
    }
  ],
  data: [
    {
      title: 'Analytics Platform',
      description: 'Real-time data visualization and reporting tool',
      backgroundColor: 'bg-gradient-to-br from-yellow-400 to-orange-500'
    },
    {
      title: 'ML Model Trainer',
      description: 'Machine learning model training and evaluation',
      backgroundColor: 'bg-gradient-to-br from-teal-400 to-blue-600'
    },
    {
      title: 'Data Pipeline',
      description: 'ETL pipeline for processing large datasets',
      backgroundColor: 'bg-gradient-to-br from-indigo-500 to-purple-600'
    }
  ],
  game: [
    {
      title: '3D Adventure Game',
      description: 'Immersive 3D adventure with stunning graphics',
      backgroundColor: 'bg-gradient-to-br from-red-500 to-pink-600'
    },
    {
      title: 'Puzzle Platformer',
      description: '2D puzzle-solving platform game',
      backgroundColor: 'bg-gradient-to-br from-emerald-400 to-cyan-500'
    }
  ],
  agents: [
    {
      title: 'AI Chatbot',
      description: 'Intelligent conversational AI assistant',
      backgroundColor: 'bg-gradient-to-br from-violet-500 to-purple-600'
    },
    {
      title: 'Automation Bot',
      description: 'Smart automation for repetitive tasks',
      backgroundColor: 'bg-gradient-to-br from-amber-400 to-orange-600'
    }
  ]
};

// Sample app templates
const SAMPLE_APPS = [
  {
    title: 'WeatherApp',
    description: 'Real-time weather dashboard',
    backgroundColor: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    isPublished: 'true',
    isPrivate: 'false'
  },
  {
    title: 'TodoMaster',
    description: 'Advanced task management system',
    backgroundColor: 'bg-gradient-to-br from-green-400 to-emerald-600',
    isPublished: 'true',
    isPrivate: 'true'
  },
  {
    title: 'ChatBot',
    description: 'AI-powered customer support bot',
    backgroundColor: 'bg-gradient-to-br from-purple-500 to-pink-600',
    isPublished: 'false',
    isPrivate: 'true',
    filesInitialized: 'false'
  },
  {
    title: 'AnalyticsDash',
    description: 'Business intelligence dashboard',
    backgroundColor: 'bg-gradient-to-br from-orange-400 to-red-500',
    isPublished: 'true',
    isPrivate: 'false'
  },
  {
    title: 'GameEngine',
    description: '2D game development framework',
    backgroundColor: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    isPublished: 'false',
    isPrivate: 'true'
  }
];

// Enhanced templates
const SAMPLE_TEMPLATES: InsertTemplate[] = [
  {
    title: 'React + TypeScript Starter',
    description: 'Modern React application with TypeScript, Tailwind CSS, and Vite',
    category: 'web',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    backgroundColor: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    iconName: 'Code',
    usageCount: '245',
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    fileStructure: {
      'src': {
        'components': {
          'App.tsx': 'React component',
          'Header.tsx': 'Header component'
        },
        'styles': {
          'globals.css': 'Global styles'
        },
        'index.tsx': 'Main entry point'
      },
      'package.json': 'Dependencies',
      'vite.config.ts': 'Vite configuration'
    },
    isOfficial: 'true'
  },
  {
    title: 'Python Data Science',
    description: 'Complete data science environment with Jupyter, pandas, and scikit-learn',
    category: 'data',
    tags: ['Python', 'Jupyter', 'Pandas', 'NumPy', 'Scikit-learn'],
    backgroundColor: 'bg-gradient-to-br from-green-500 to-teal-600',
    iconName: 'BarChart3',
    usageCount: '189',
    difficulty: 'intermediate',
    estimatedTime: '45 minutes',
    fileStructure: {
      'notebooks': {
        'data_analysis.ipynb': 'Main analysis notebook',
        'visualization.ipynb': 'Data visualization'
      },
      'data': {
        'sample_data.csv': 'Sample dataset'
      },
      'requirements.txt': 'Python dependencies'
    },
    isOfficial: 'true'
  },
  {
    title: 'Unity 3D Game',
    description: 'Complete 3D game setup with Unity and C# scripting',
    category: 'game',
    tags: ['Unity', 'C#', '3D', 'Game Development'],
    backgroundColor: 'bg-gradient-to-br from-purple-500 to-pink-600',
    iconName: 'Gamepad2',
    usageCount: '156',
    difficulty: 'advanced',
    estimatedTime: '2 hours',
    fileStructure: {
      'Assets': {
        'Scripts': {
          'PlayerController.cs': 'Player movement',
          'GameManager.cs': 'Game logic'
        },
        'Scenes': {
          'MainScene.unity': 'Main game scene'
        }
      },
      'ProjectSettings': {
        'ProjectVersion.txt': 'Unity version'
      }
    },
    isOfficial: 'true'
  },
  {
    title: 'Express.js API',
    description: 'RESTful API with Express.js, TypeScript, and PostgreSQL',
    category: 'web',
    tags: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'REST API'],
    backgroundColor: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    iconName: 'Server',
    usageCount: '298',
    difficulty: 'intermediate',
    estimatedTime: '1 hour',
    fileStructure: {
      'src': {
        'routes': {
          'auth.ts': 'Authentication routes',
          'users.ts': 'User management'
        },
        'middleware': {
          'auth.ts': 'Auth middleware'
        },
        'app.ts': 'Express app setup'
      },
      'package.json': 'Dependencies',
      'tsconfig.json': 'TypeScript config'
    },
    isOfficial: 'true'
  },
  {
    title: 'AI Chatbot',
    description: 'Intelligent chatbot using OpenAI API with conversation memory',
    category: 'agents',
    tags: ['OpenAI', 'Python', 'FastAPI', 'LangChain'],
    backgroundColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconName: 'Bot',
    usageCount: '134',
    difficulty: 'advanced',
    estimatedTime: '1.5 hours',
    fileStructure: {
      'src': {
        'chatbot.py': 'Main chatbot logic',
        'memory.py': 'Conversation memory',
        'api.py': 'FastAPI endpoints'
      },
      'requirements.txt': 'Python dependencies',
      'config.py': 'Configuration'
    },
    isOfficial: 'true'
  }
];

async function createUsers() {
  console.log('🔄 Creating sample users...');
  
  for (const userData of SAMPLE_USERS) {
    try {
      await storage.upsertUser(userData);
      console.log(`✅ Created user: ${userData.firstName} ${userData.lastName}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.firstName}:`, error);
    }
  }
}

async function createWorkspaces() {
  console.log('🔄 Creating team workspaces...');
  
  const createdWorkspaces: any[] = [];
  
  for (const workspaceData of SAMPLE_WORKSPACES) {
    try {
      const workspace = await storage.createWorkspace(workspaceData);
      createdWorkspaces.push(workspace);
      console.log(`✅ Created workspace: ${workspace.name}`);
    } catch (error) {
      console.error(`❌ Failed to create workspace ${workspaceData.name}:`, error);
    }
  }
  
  return createdWorkspaces;
}

async function addWorkspaceMembers(workspaces: any[]) {
  console.log('🔄 Adding members to team workspaces...');
  
  // Get all personal workspaces to add users as owners
  const personalWorkspaces = await storage.getUserWorkspaces('user1');
  
  // Add workspace members to teams
  for (let i = 0; i < workspaces.length; i++) {
    const workspace = workspaces[i];
    
    // Add owner
    try {
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: 'user1',
        role: 'owner'
      });
      console.log(`✅ Added owner to ${workspace.name}`);
    } catch (error) {
      console.error(`❌ Failed to add owner to ${workspace.name}:`, error);
    }
    
    // Add 2-3 members to each team
    const memberUserIds = i === 0 ? ['user2', 'user3', 'user4'] : ['user3', 'user4', 'user5'];
    
    for (const userId of memberUserIds) {
      try {
        await storage.addWorkspaceMember({
          workspaceId: workspace.id,
          userId: userId,
          role: Math.random() > 0.7 ? 'admin' : 'member'
        });
        console.log(`✅ Added member ${userId} to ${workspace.name}`);
      } catch (error) {
        console.error(`❌ Failed to add member ${userId} to ${workspace.name}:`, error);
      }
    }
  }
}

async function createProjects(workspaces: any[]) {
  console.log('🔄 Creating projects for all workspaces...');
  
  // Get personal workspace
  const personalWorkspaces = await storage.getUserWorkspaces('user1');
  const personalWorkspace = personalWorkspaces.find(w => w.type === 'personal');
  
  if (!personalWorkspace) {
    console.error('❌ No personal workspace found');
    return;
  }
  
  // All workspaces to populate (personal + teams)
  const allWorkspaces = [personalWorkspace, ...workspaces];
  
  for (const workspace of allWorkspaces) {
    console.log(`🔄 Creating projects for ${workspace.name}...`);
    
    // Create projects for each category
    for (const [category, projectTemplates] of Object.entries(SAMPLE_PROJECTS)) {
      // Create 2-4 projects per category per workspace
      const numProjects = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numProjects && i < projectTemplates.length; i++) {
        const template = projectTemplates[i];
        
        try {
          const project = await storage.createProject({
            workspaceId: workspace.id,
            title: `${template.title} ${workspace.type === 'personal' ? '' : `(${workspace.name})`}`,
            description: template.description,
            category: category as any,
            isPrivate: Math.random() > 0.3 ? 'true' : 'false',
            backgroundColor: template.backgroundColor,
            deploymentStatus: Math.random() > 0.6 ? 'published' : undefined,
            importSource: Math.random() > 0.8 ? 'github' : undefined,
            importUrl: Math.random() > 0.8 ? `https://github.com/example/${template.title.toLowerCase().replace(/\s/g, '-')}` : undefined
          });
          
          console.log(`✅ Created project: ${project.title}`);
        } catch (error) {
          console.error(`❌ Failed to create project ${template.title}:`, error);
        }
      }
    }
  }
}

async function createApps(workspaces: any[]) {
  console.log('🔄 Creating apps for all workspaces...');
  
  // Get personal workspace
  const personalWorkspaces = await storage.getUserWorkspaces('user1');
  const personalWorkspace = personalWorkspaces.find(w => w.type === 'personal');
  
  if (!personalWorkspace) {
    console.error('❌ No personal workspace found');
    return;
  }
  
  // All workspaces to populate (personal + teams)
  const allWorkspaces = [personalWorkspace, ...workspaces];
  
  for (const workspace of allWorkspaces) {
    console.log(`🔄 Creating apps for ${workspace.name}...`);
    
    // Create 3-5 apps per workspace
    const numApps = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numApps && i < SAMPLE_APPS.length; i++) {
      const appTemplate = SAMPLE_APPS[i];
      
      try {
        const app = await storage.createApp({
          workspaceId: workspace.id,
          title: `${appTemplate.title}${workspace.type === 'personal' ? '' : `_${workspace.name.replace(/\s/g, '')}`}`,
          creator: `user${Math.floor(Math.random() * 5) + 1}`,
          isPublished: appTemplate.isPublished,
          isPrivate: appTemplate.isPrivate,
          backgroundColor: appTemplate.backgroundColor,
          filesInitialized: appTemplate.filesInitialized || 'true',
          objectStoragePath: `apps/${workspace.id}/${Date.now()}-${appTemplate.title.toLowerCase()}`
        });
        
        console.log(`✅ Created app: ${app.title}`);
      } catch (error) {
        console.error(`❌ Failed to create app ${appTemplate.title}:`, error);
      }
    }
  }
}

async function createTemplates() {
  console.log('🔄 Creating enhanced template library...');
  
  for (const template of SAMPLE_TEMPLATES) {
    try {
      // Templates are created directly without workspace association
      await storage.createTemplate ? 
        await storage.createTemplate(template) :
        console.log('⚠️ createTemplate method not available');
      
      console.log(`✅ Created template: ${template.title}`);
    } catch (error) {
      console.error(`❌ Failed to create template ${template.title}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting database seeding process...\n');
  
  try {
    // Step 1: Create users
    await createUsers();
    console.log('');
    
    // Step 2: Create team workspaces
    const workspaces = await createWorkspaces();
    console.log('');
    
    // Step 3: Add members to workspaces
    await addWorkspaceMembers(workspaces);
    console.log('');
    
    // Step 4: Create projects for all workspaces
    await createProjects(workspaces);
    console.log('');
    
    // Step 5: Create apps for all workspaces
    await createApps(workspaces);
    console.log('');
    
    // Step 6: Create enhanced templates
    await createTemplates();
    console.log('');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   👥 Users created: ${SAMPLE_USERS.length}`);
    console.log(`   🏢 Team workspaces: ${SAMPLE_WORKSPACES.length}`);
    console.log(`   📁 Projects: ~${Object.values(SAMPLE_PROJECTS).flat().length * 3} across all workspaces`);
    console.log(`   🚀 Apps: ~${SAMPLE_APPS.length * 3} across all workspaces`);
    console.log(`   📋 Templates: ${SAMPLE_TEMPLATES.length}`);
    console.log('');
    console.log('🔗 Access your development data at http://localhost:5000');
    
  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  }
}

// Run the seeding process
main().catch(console.error);

export { main as seedDatabase };