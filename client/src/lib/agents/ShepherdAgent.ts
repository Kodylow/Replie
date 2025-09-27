import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResponse, TaskContext } from './types';

export class ShepherdAgent extends BaseAgent {
  constructor() {
    super('shepherd', {
      canEditFiles: false,
      canAnalyzeCode: true,
      canProvideGuidance: true,
      canCoordinate: true,
      canMakeDecisions: false
    }, `You are the Shepherd Agent responsible for guiding processes and ensuring completion.
Your role is to:
- Monitor task progress and quality
- Ensure all requirements are met
- Guide users through complex workflows
- Validate implementations and suggest improvements
- Keep projects on track and organized`);
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const { userMessage, fileContents, conversationHistory } = context;
    const progressAssessment = this.assessProgress(conversationHistory, fileContents);
    const qualityCheck = this.performQualityCheck(fileContents);
    const guidance = this.provideGuidance(userMessage, progressAssessment);
    
    return this.formatResponse(
      `I'm monitoring your project progress. Here's my assessment:\n\n` +
      `**Progress Assessment:**\n${progressAssessment}\n\n` +
      `**Quality Check:**\n${qualityCheck}\n\n` +
      `**Guidance:**\n${guidance}\n\n` +
      `I'll continue to monitor and guide you through the next steps.`
    );
  }

  protected isCapableOf(task: TaskContext): boolean {
    // Shepherd can guide any task but specializes in complex, ongoing work
    return task.complexity !== 'simple';
  }

  private assessProgress(conversationHistory: any[], fileContents: Record<string, string>): string {
    const assessment = [];
    
    // Analyze conversation history for progress indicators
    const hasPlanning = conversationHistory.some(msg => 
      msg.content?.toLowerCase().includes('plan') || 
      msg.agentType === 'architect' || 
      msg.agentType === 'advisor'
    );
    
    const hasImplementation = conversationHistory.some(msg => 
      msg.agentType === 'editor' || 
      msg.content?.toLowerCase().includes('implement')
    );
    
    // Analyze file completeness
    const fileStatus = this.analyzeFileCompleteness(fileContents);
    
    assessment.push('📊 **Current Status:**');
    assessment.push(`- Planning phase: ${hasPlanning ? '✅ Completed' : '⏳ In progress'}`);
    assessment.push(`- Implementation: ${hasImplementation ? '✅ Active' : '⚠️ Pending'}`);
    assessment.push(`- File development: ${fileStatus}`);
    
    // Determine overall progress percentage
    let progress = 0;
    if (hasPlanning) progress += 25;
    if (hasImplementation) progress += 25;
    if (this.hasBasicStructure(fileContents)) progress += 25;
    if (this.hasAdvancedFeatures(fileContents)) progress += 25;
    
    assessment.push(`- Overall progress: ${progress}% complete`);
    
    return assessment.join('\n');
  }

  private analyzeFileCompleteness(fileContents: Record<string, string>): string {
    const files = ['index.html', 'styles.css', 'script.js', 'db.json'];
    const existingFiles = files.filter(file => 
      fileContents[file] && fileContents[file].trim().length > 0
    );
    
    return `${existingFiles.length}/${files.length} files have content`;
  }

  private hasBasicStructure(fileContents: Record<string, string>): boolean {
    const html = fileContents['index.html'] || '';
    const css = fileContents['styles.css'] || '';
    const js = fileContents['script.js'] || '';
    
    return html.includes('<html') && css.length > 50 && js.length > 20;
  }

  private hasAdvancedFeatures(fileContents: Record<string, string>): boolean {
    const html = fileContents['index.html'] || '';
    const css = fileContents['styles.css'] || '';
    const js = fileContents['script.js'] || '';
    
    const hasInteractivity = js.includes('addEventListener') || js.includes('onclick');
    const hasStyling = css.includes('class') || css.includes('#');
    const hasStructure = html.includes('<div') || html.includes('<section');
    
    return hasInteractivity && hasStyling && hasStructure;
  }

  private performQualityCheck(fileContents: Record<string, string>): string {
    const issues = [];
    const suggestions = [];
    
    // HTML Quality Check
    const html = fileContents['index.html'] || '';
    if (html && !html.includes('<!DOCTYPE html>')) {
      issues.push('❌ Missing DOCTYPE declaration in HTML');
    }
    if (html && !html.includes('<meta charset=')) {
      issues.push('⚠️ Missing charset meta tag');
    }
    if (html && !html.includes('<title>')) {
      issues.push('⚠️ Missing page title');
    }
    
    // CSS Quality Check
    const css = fileContents['styles.css'] || '';
    if (css && css.includes('!important')) {
      issues.push('⚠️ Overuse of !important in CSS');
    }
    
    // JavaScript Quality Check
    const js = fileContents['script.js'] || '';
    if (js && !js.includes('addEventListener') && js.includes('onclick=')) {
      suggestions.push('💡 Consider using addEventListener instead of inline event handlers');
    }
    
    // Positive findings
    if (html.includes('aria-') || html.includes('role=')) {
      suggestions.push('✅ Good accessibility practices detected');
    }
    if (css.includes('@media')) {
      suggestions.push('✅ Responsive design implemented');
    }
    if (js.includes('try') && js.includes('catch')) {
      suggestions.push('✅ Error handling implemented');
    }
    
    const result = [];
    if (issues.length > 0) {
      result.push('**Issues Found:**', ...issues);
    }
    if (suggestions.length > 0) {
      result.push('**Positive Notes:**', ...suggestions);
    }
    if (issues.length === 0 && suggestions.length === 0) {
      result.push('✅ No major quality issues detected');
    }
    
    return result.join('\n');
  }

  private provideGuidance(userMessage: string, progressAssessment: string): string {
    const message = userMessage.toLowerCase();
    const guidance = [];
    
    if (message.includes('stuck') || message.includes('help')) {
      guidance.push('🆘 **Getting Unstuck:**');
      guidance.push('1. Break down your problem into smaller steps');
      guidance.push('2. Ask the Advisor for best practices');
      guidance.push('3. Have the Architect review your structure');
      guidance.push('4. Use the Editor for specific implementations');
    } else if (message.includes('next') || message.includes('what should')) {
      guidance.push('🎯 **Next Steps Recommendation:**');
      
      if (progressAssessment.includes('0% complete')) {
        guidance.push('1. Start with planning - ask the Architect for structure advice');
        guidance.push('2. Get recommendations from the Advisor');
        guidance.push('3. Begin implementation with the Editor');
      } else if (progressAssessment.includes('25% complete')) {
        guidance.push('1. Begin implementation with core features');
        guidance.push('2. Focus on HTML structure first');
        guidance.push('3. Add basic styling and interactions');
      } else if (progressAssessment.includes('50% complete')) {
        guidance.push('1. Enhance styling and user experience');
        guidance.push('2. Add interactive features');
        guidance.push('3. Test across different scenarios');
      } else {
        guidance.push('1. Perform thorough testing');
        guidance.push('2. Optimize performance');
        guidance.push('3. Add final polish and documentation');
      }
    } else {
      guidance.push('🧭 **General Guidance:**');
      guidance.push('- Focus on one feature at a time');
      guidance.push('- Test each change before moving forward');
      guidance.push('- Keep code clean and well-organized');
      guidance.push('- Ask for help when you need clarification');
    }
    
    return guidance.join('\n');
  }
}