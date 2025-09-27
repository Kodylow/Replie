import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResponse, TaskContext } from './types';

export class AdvisorAgent extends BaseAgent {
  constructor() {
    super('advisor', {
      canEditFiles: false,
      canAnalyzeCode: true,
      canProvideGuidance: true,
      canCoordinate: false,
      canMakeDecisions: false
    }, `You are the Advisor Agent specialized in providing recommendations and best practices.
Your role is to:
- Offer expert advice on development decisions
- Suggest best practices and patterns
- Provide learning resources and explanations
- Help with technology choices and approaches
- Guide users toward optimal solutions`);
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const { userMessage, fileContents } = context;
    const advice = this.generateAdvice(userMessage, fileContents);
    const bestPractices = this.getBestPractices(userMessage);
    const nextSteps = this.suggestNextSteps(userMessage);
    
    return this.formatResponse(
      `Here's my advice for your request: "${userMessage}"\n\n` +
      `**My Recommendation:**\n${advice}\n\n` +
      `**Best Practices:**\n${bestPractices}\n\n` +
      `**Suggested Next Steps:**\n${nextSteps}\n\n` +
      `Would you like me to have the Editor implement these suggestions?`
    );
  }

  protected isCapableOf(task: TaskContext): boolean {
    // Advisor handles guidance and recommendation tasks
    return true; // Advisor can provide guidance for any task
  }

  private generateAdvice(userMessage: string, fileContents: Record<string, string>): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('should i') || message.includes('which is better')) {
      return this.generateDecisionAdvice(message, fileContents);
    }
    
    if (message.includes('how to') || message.includes('best way')) {
      return this.generateImplementationAdvice(message, fileContents);
    }
    
    if (message.includes('improve') || message.includes('optimize')) {
      return this.generateOptimizationAdvice(message, fileContents);
    }
    
    return this.generateGeneralAdvice(message, fileContents);
  }

  private generateDecisionAdvice(message: string, fileContents: Record<string, string>): string {
    const advice = [];
    
    if (message.includes('framework') || message.includes('library')) {
      advice.push('🎯 **Framework Choice:**');
      advice.push('For your current app structure, I recommend:');
      advice.push('- Vanilla JavaScript for simple interactions');
      advice.push('- Consider React/Vue for complex state management');
      advice.push('- CSS frameworks like Tailwind for rapid styling');
    }
    
    if (message.includes('database') || message.includes('storage')) {
      advice.push('💾 **Data Storage:**');
      advice.push('Based on your needs:');
      advice.push('- Local Storage for client-side data');
      advice.push('- JSON files for static/mock data');
      advice.push('- Consider Firebase for real-time features');
    }
    
    return advice.length > 0 ? advice.join('\n') : 'I need more context about your specific decision to provide targeted advice.';
  }

  private generateImplementationAdvice(message: string, fileContents: Record<string, string>): string {
    const advice = [];
    
    if (message.includes('responsive') || message.includes('mobile')) {
      advice.push('📱 **Responsive Implementation:**');
      advice.push('1. Start with mobile-first CSS design');
      advice.push('2. Use CSS Grid/Flexbox for layouts');
      advice.push('3. Test on actual devices, not just browser tools');
      advice.push('4. Consider touch interactions and accessibility');
    }
    
    if (message.includes('form') || message.includes('validation')) {
      advice.push('📝 **Form Best Practices:**');
      advice.push('1. Always validate on both client and server');
      advice.push('2. Provide clear, helpful error messages');
      advice.push('3. Use proper input types (email, tel, etc.)');
      advice.push('4. Add loading states for submissions');
    }
    
    if (message.includes('animation') || message.includes('transition')) {
      advice.push('✨ **Animation Guidelines:**');
      advice.push('1. Keep animations subtle and purposeful');
      advice.push('2. Use CSS transitions over JavaScript when possible');
      advice.push('3. Respect user motion preferences');
      advice.push('4. Test performance on lower-end devices');
    }
    
    return advice.length > 0 ? advice.join('\n') : 'Could you be more specific about what you\'d like to implement?';
  }

  private generateOptimizationAdvice(message: string, fileContents: Record<string, string>): string {
    const advice = [];
    const hasLargeJS = (fileContents['script.js'] || '').length > 1000;
    const hasLargeCSS = (fileContents['styles.css'] || '').length > 2000;
    
    advice.push('⚡ **Performance Optimization:**');
    
    if (hasLargeJS) {
      advice.push('- Consider code splitting for large JavaScript files');
      advice.push('- Remove unused functions and variables');
      advice.push('- Use async/defer for non-critical scripts');
    }
    
    if (hasLargeCSS) {
      advice.push('- Remove unused CSS selectors');
      advice.push('- Use CSS custom properties for consistent theming');
      advice.push('- Consider critical CSS extraction');
    }
    
    advice.push('- Optimize images (use WebP format when possible)');
    advice.push('- Minimize HTTP requests');
    advice.push('- Add proper caching headers');
    advice.push('- Use semantic HTML for better SEO');
    
    return advice.join('\n');
  }

  private generateGeneralAdvice(message: string, fileContents: Record<string, string>): string {
    return `Based on your current app structure, here are my general recommendations:

🎯 **Code Quality:**
- Add proper error handling and validation
- Use consistent naming conventions
- Include helpful comments for complex logic
- Implement proper separation of concerns

🏗️ **Architecture:**
- Keep HTML semantic and accessible
- Organize CSS with a clear methodology
- Structure JavaScript in logical modules
- Plan for future scalability

🔧 **Development Process:**
- Test across different browsers and devices
- Use version control for all changes
- Consider automated testing for critical features
- Plan for maintenance and updates`;
  }

  private getBestPractices(userMessage: string): string {
    const message = userMessage.toLowerCase();
    const practices = [];
    
    if (message.includes('html') || message.includes('markup')) {
      practices.push('🏷️ **HTML Best Practices:**');
      practices.push('- Use semantic elements (header, nav, main, section)');
      practices.push('- Include proper meta tags and descriptions');
      practices.push('- Ensure keyboard navigation works');
      practices.push('- Add alt text for all images');
    }
    
    if (message.includes('css') || message.includes('style')) {
      practices.push('🎨 **CSS Best Practices:**');
      practices.push('- Use a consistent naming convention (BEM, OOCSS)');
      practices.push('- Avoid overly specific selectors');
      practices.push('- Use CSS custom properties for theming');
      practices.push('- Test in different browsers');
    }
    
    if (message.includes('javascript') || message.includes('js')) {
      practices.push('⚙️ **JavaScript Best Practices:**');
      practices.push('- Always use strict mode');
      practices.push('- Handle errors gracefully');
      practices.push('- Use const/let instead of var');
      practices.push('- Add event listeners properly');
    }
    
    return practices.length > 0 ? practices.join('\n') : 
      '📚 Consider following modern web development standards and accessibility guidelines.';
  }

  private suggestNextSteps(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('improve') || message.includes('enhance')) {
      return `1. 🔍 Review current code for optimization opportunities
2. 🧪 Test the current functionality thoroughly
3. 📋 Plan incremental improvements
4. 🚀 Implement changes with proper testing
5. 📊 Monitor performance after changes`;
    }
    
    if (message.includes('add') || message.includes('create')) {
      return `1. 📐 Plan the new feature's requirements
2. 🏗️ Design the implementation approach
3. 💻 Code the feature incrementally
4. 🧪 Test thoroughly in different scenarios
5. 📖 Document the new functionality`;
    }
    
    return `1. 🎯 Clarify specific requirements and goals
2. 🔍 Analyze current app structure
3. 📋 Create an implementation plan
4. 💻 Execute changes systematically
5. ✅ Test and validate results`;
  }
}