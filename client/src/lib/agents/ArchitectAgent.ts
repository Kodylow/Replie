import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResponse, TaskContext } from './types';

export class ArchitectAgent extends BaseAgent {
  constructor() {
    super('architect', {
      canEditFiles: false,
      canAnalyzeCode: true,
      canProvideGuidance: true,
      canCoordinate: false,
      canMakeDecisions: true
    }, `You are the Architect Agent specialized in system design and structural decisions.
Your role is to:
- Analyze code architecture and patterns
- Recommend structural improvements
- Design scalable solutions
- Identify technical debt and refactoring opportunities
- Provide high-level design guidance`);
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const { userMessage, fileContents } = context;
    const analysis = this.analyzeCurrentArchitecture(fileContents);
    const recommendations = this.generateRecommendations(userMessage, analysis);
    
    return this.formatResponse(
      `I've analyzed your app's architecture. Here's my assessment:\n\n` +
      `**Current Architecture Analysis:**\n${analysis}\n\n` +
      `**Recommendations:**\n${recommendations}\n\n` +
      `Would you like me to delegate the implementation to the Editor agent?`
    );
  }

  protected isCapableOf(task: TaskContext): boolean {
    // Architect handles structural and architectural decisions
    return task.complexity === 'architectural' || task.complexity === 'complex';
  }

  private analyzeCurrentArchitecture(fileContents: Record<string, string>): string {
    const html = fileContents['index.html'] || '';
    const css = fileContents['styles.css'] || '';
    const js = fileContents['script.js'] || '';
    const json = fileContents['db.json'] || '';

    const analysis: string[] = [];

    // HTML Analysis
    if (html) {
      const hasSemanticHTML = /(<header|<nav|<main|<section|<article|<aside|<footer)/.test(html);
      const hasAccessibility = /(aria-|role=|alt=)/.test(html);
      const hasFormStructure = /<form/.test(html);
      
      analysis.push(`**HTML Structure:**`);
      analysis.push(`- Semantic HTML: ${hasSemanticHTML ? '✅ Good' : '⚠️ Could improve'}`);
      analysis.push(`- Accessibility: ${hasAccessibility ? '✅ Present' : '⚠️ Missing'}`);
      analysis.push(`- Forms: ${hasFormStructure ? '✅ Structured' : '➖ None detected'}`);
    }

    // CSS Analysis
    if (css) {
      const hasModularCSS = /(@media|\.component|\.module)/.test(css);
      const hasVariables = /(--[\w-]+:|var\()/.test(css);
      const hasFlexboxGrid = /(display:\s*flex|display:\s*grid)/.test(css);
      
      analysis.push(`**CSS Architecture:**`);
      analysis.push(`- Modular approach: ${hasModularCSS ? '✅ Good' : '⚠️ Monolithic'}`);
      analysis.push(`- CSS Variables: ${hasVariables ? '✅ Used' : '⚠️ Missing'}`);
      analysis.push(`- Modern layout: ${hasFlexboxGrid ? '✅ Flexbox/Grid' : '⚠️ Basic'}`);
    }

    // JavaScript Analysis
    if (js) {
      const hasModules = /(import |export |module\.exports)/.test(js);
      const hasEventDelegation = /addEventListener/.test(js);
      const hasErrorHandling = /(try\s*{|catch\s*\(|\.catch\()/.test(js);
      const hasAsyncCode = /(async |await |Promise)/.test(js);
      
      analysis.push(`**JavaScript Architecture:**`);
      analysis.push(`- Module system: ${hasModules ? '✅ Modular' : '⚠️ Global scope'}`);
      analysis.push(`- Event handling: ${hasEventDelegation ? '✅ Proper events' : '⚠️ Basic'}`);
      analysis.push(`- Error handling: ${hasErrorHandling ? '✅ Present' : '⚠️ Missing'}`);
      analysis.push(`- Async patterns: ${hasAsyncCode ? '✅ Modern' : '➖ Synchronous'}`);
    }

    // Data Architecture
    if (json) {
      try {
        const data = JSON.parse(json);
        const hasStructure = typeof data === 'object' && Object.keys(data).length > 0;
        analysis.push(`**Data Structure:**`);
        analysis.push(`- JSON validity: ✅ Valid`);
        analysis.push(`- Structure: ${hasStructure ? '✅ Organized' : '⚠️ Empty/Basic'}`);
      } catch {
        analysis.push(`**Data Structure:**`);
        analysis.push(`- JSON validity: ❌ Invalid JSON`);
      }
    }

    return analysis.join('\n');
  }

  private generateRecommendations(userMessage: string, analysis: string): string {
    const message = userMessage.toLowerCase();
    const recommendations: string[] = [];

    // General architectural recommendations
    if (message.includes('scale') || message.includes('performance')) {
      recommendations.push('📈 **Scalability Focus:**');
      recommendations.push('- Implement component-based architecture');
      recommendations.push('- Add lazy loading for better performance');
      recommendations.push('- Consider state management patterns');
      recommendations.push('- Optimize bundle size and asset loading');
    }

    if (message.includes('maintain') || message.includes('clean')) {
      recommendations.push('🧹 **Maintainability:**');
      recommendations.push('- Separate concerns into distinct modules');
      recommendations.push('- Add comprehensive error handling');
      recommendations.push('- Implement consistent naming conventions');
      recommendations.push('- Add code documentation and comments');
    }

    if (message.includes('responsive') || message.includes('mobile')) {
      recommendations.push('📱 **Responsive Design:**');
      recommendations.push('- Use CSS Grid and Flexbox for layouts');
      recommendations.push('- Implement mobile-first design approach');
      recommendations.push('- Add proper viewport meta tags');
      recommendations.push('- Test across different screen sizes');
    }

    if (message.includes('security') || message.includes('safe')) {
      recommendations.push('🔒 **Security:**');
      recommendations.push('- Sanitize user inputs');
      recommendations.push('- Implement proper form validation');
      recommendations.push('- Add CSRF protection for forms');
      recommendations.push('- Use HTTPS for external API calls');
    }

    // If no specific recommendations, provide general guidance
    if (recommendations.length === 0) {
      recommendations.push('🎯 **General Improvements:**');
      recommendations.push('- Add semantic HTML structure');
      recommendations.push('- Implement CSS custom properties');
      recommendations.push('- Use modern JavaScript patterns');
      recommendations.push('- Add accessibility features');
      recommendations.push('- Implement error boundaries');
    }

    return recommendations.join('\n');
  }
}