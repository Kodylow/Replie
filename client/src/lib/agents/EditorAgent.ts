import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResponse, TaskContext, AgentAction } from './types';

export class EditorAgent extends BaseAgent {
  constructor() {
    super('editor', {
      canEditFiles: true,
      canAnalyzeCode: true,
      canProvideGuidance: false,
      canCoordinate: false,
      canMakeDecisions: false
    }, `You are the Editor Agent specialized in making direct code changes and file modifications.
Your role is to:
- Implement specific code changes and edits
- Create, modify, and delete files as needed
- Write clean, functional code that meets requirements
- Focus on practical implementation rather than planning
- Make precise, targeted changes with clear explanations`);
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const { userMessage, fileContents } = context;
    const task = this.analyzeTask(context);
    
    // Analyze what files need to be changed
    const filesToEdit = this.identifyFilesToEdit(userMessage, fileContents);
    const actions = await this.generateEditActions(userMessage, fileContents, filesToEdit);
    
    if (actions.length === 0) {
      return this.formatResponse(
        `I've analyzed your request but couldn't identify specific file changes needed. Could you be more specific about what you'd like me to edit?\n\n` +
        `For example:\n` +
        `- "Add a button to the HTML"\n` +
        `- "Change the background color in CSS"\n` +
        `- "Add a click handler function in JavaScript"`
      );
    }

    const response = this.generateImplementationPlan(userMessage, actions, task);
    
    return this.formatResponse(response, actions);
  }

  protected isCapableOf(task: TaskContext): boolean {
    // Editor handles direct implementation tasks
    return task.complexity !== 'architectural' && this.capabilities.canEditFiles;
  }

  private identifyFilesToEdit(userMessage: string, fileContents: Record<string, string>): string[] {
    const message = userMessage.toLowerCase();
    const files: string[] = [];
    
    // Direct file mentions
    if (message.includes('html') || message.includes('markup') || message.includes('dom')) {
      files.push('index.html');
    }
    if (message.includes('css') || message.includes('style') || message.includes('design') || 
        message.includes('color') || message.includes('layout')) {
      files.push('styles.css');
    }
    if (message.includes('javascript') || message.includes('js') || message.includes('function') || 
        message.includes('click') || message.includes('event') || message.includes('logic')) {
      files.push('script.js');
    }
    if (message.includes('data') || message.includes('json') || message.includes('api')) {
      files.push('db.json');
    }

    // If no specific files mentioned, infer from action type
    if (files.length === 0) {
      if (message.includes('button') || message.includes('form') || message.includes('input') || 
          message.includes('element') || message.includes('component')) {
        files.push('index.html', 'styles.css', 'script.js');
      } else if (message.includes('appearance') || message.includes('look') || message.includes('visual')) {
        files.push('styles.css');
      } else if (message.includes('behavior') || message.includes('interactive') || message.includes('dynamic')) {
        files.push('script.js');
      } else {
        // Default to all files for broad requests
        files.push('index.html', 'styles.css', 'script.js');
      }
    }

    return files.filter(file => Object.keys(fileContents).includes(file));
  }

  private async generateEditActions(
    userMessage: string, 
    fileContents: Record<string, string>, 
    filesToEdit: string[]
  ): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    
    for (const filename of filesToEdit) {
      const currentContent = fileContents[filename] || '';
      const suggestedEdit = this.generateFileEdit(userMessage, filename, currentContent);
      
      if (suggestedEdit) {
        actions.push({
          type: 'file_edit',
          target: filename,
          content: suggestedEdit,
          reason: `Implementing requested changes in ${filename}`
        });
      }
    }
    
    return actions;
  }

  private generateFileEdit(userMessage: string, filename: string, currentContent: string): string | null {
    const message = userMessage.toLowerCase();
    
    switch (filename) {
      case 'index.html':
        return this.generateHTMLEdit(message, currentContent);
      case 'styles.css':
        return this.generateCSSEdit(message, currentContent);
      case 'script.js':
        return this.generateJSEdit(message, currentContent);
      case 'db.json':
        return this.generateJSONEdit(message, currentContent);
      default:
        return null;
    }
  }

  private generateHTMLEdit(message: string, currentContent: string): string | null {
    // Basic HTML edit patterns
    if (message.includes('button')) {
      const buttonHTML = `<button id="newButton" class="btn">Click Me</button>`;
      if (currentContent.includes('</body>')) {
        return currentContent.replace('</body>', `  ${buttonHTML}\n</body>`);
      }
    }
    
    if (message.includes('heading') || message.includes('title')) {
      const headingHTML = `<h2>New Heading</h2>`;
      if (currentContent.includes('</body>')) {
        return currentContent.replace('</body>', `  ${headingHTML}\n</body>`);
      }
    }
    
    return null;
  }

  private generateCSSEdit(message: string, currentContent: string): string | null {
    let newCSS = currentContent;
    
    if (message.includes('background') && message.includes('color')) {
      newCSS += `\nbody {\n  background-color: #f0f0f0;\n}\n`;
    }
    
    if (message.includes('button') && message.includes('style')) {
      newCSS += `\n.btn {\n  padding: 10px 20px;\n  background-color: #007bff;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}\n`;
    }
    
    return newCSS !== currentContent ? newCSS : null;
  }

  private generateJSEdit(message: string, currentContent: string): string | null {
    let newJS = currentContent;
    
    if (message.includes('click') || message.includes('button')) {
      newJS += `\n// Add click event listener\ndocument.addEventListener('DOMContentLoaded', function() {\n  const button = document.getElementById('newButton');\n  if (button) {\n    button.addEventListener('click', function() {\n      alert('Button clicked!');\n    });\n  }\n});\n`;
    }
    
    return newJS !== currentContent ? newJS : null;
  }

  private generateJSONEdit(message: string, currentContent: string): string | null {
    // Basic JSON structure if empty
    if (!currentContent.trim()) {
      return '{\n  "data": [],\n  "config": {}\n}';
    }
    return null;
  }

  private generateImplementationPlan(userMessage: string, actions: AgentAction[], task: TaskContext): string {
    const filesList = actions.map(action => action.target).join(', ');
    
    return `I'll implement your request: "${userMessage}"\n\n` +
           `**Implementation Plan:**\n` +
           `- Files to modify: ${filesList}\n` +
           `- Complexity: ${task.complexity}\n` +
           `- Estimated time: ${task.estimatedTime}\n\n` +
           `**Changes I'll make:**\n` +
           actions.map((action, index) => 
             `${index + 1}. **${action.target}**: ${action.reason}`
           ).join('\n') +
           `\n\nThese changes will be applied automatically. You can review them in the file editor and save when ready.`;
  }
}