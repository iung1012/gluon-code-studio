import { SystemPrompts, SYSTEM_PROMPTS, getUserPrompt } from './systemPrompts';

export type ProjectStack = keyof SystemPrompts;

export interface PromptConfig {
  description: string;
  stack: ProjectStack;
  features?: string[];
  requirements?: string[];
  style?: 'modern' | 'minimal' | 'corporate' | 'creative' | 'elegant';
  complexity?: 'simple' | 'intermediate' | 'complex' | 'enterprise';
}

export class PromptBuilder {
  private config: PromptConfig;

  constructor(config: PromptConfig) {
    this.config = config;
  }

  buildSystemPrompt(): string {
    let systemPrompt = SYSTEM_PROMPTS[this.config.stack];

    // Add style-specific instructions
    if (this.config.style) {
      systemPrompt += this.getStyleInstructions();
    }

    // Add complexity-specific instructions
    if (this.config.complexity) {
      systemPrompt += this.getComplexityInstructions();
    }

    // Add feature-specific instructions
    if (this.config.features && this.config.features.length > 0) {
      systemPrompt += this.getFeatureInstructions();
    }

    // Add requirement-specific instructions
    if (this.config.requirements && this.config.requirements.length > 0) {
      systemPrompt += this.getRequirementInstructions();
    }

    return systemPrompt;
  }

  buildUserPrompt(): string {
    let userPrompt = getUserPrompt(this.config.description, this.config.stack);

    // Add additional context
    if (this.config.features && this.config.features.length > 0) {
      userPrompt += `\n\nFeatures to include: ${this.config.features.join(', ')}`;
    }

    if (this.config.requirements && this.config.requirements.length > 0) {
      userPrompt += `\n\nRequirements: ${this.config.requirements.join(', ')}`;
    }

    return userPrompt;
  }

  private getStyleInstructions(): string {
    const styleInstructions = {
      modern: `
- Use modern design trends and patterns
- Implement clean, minimalist interfaces
- Use modern color palettes and typography
- Include subtle animations and transitions
- Focus on user experience and accessibility
`,
      minimal: `
- Use minimal design principles
- Implement clean, simple interfaces
- Use plenty of white space
- Focus on essential elements only
- Use simple, clean typography
`,
      corporate: `
- Use professional, business-appropriate design
- Implement clean, structured layouts
- Use corporate color schemes
- Focus on clarity and professionalism
- Include proper branding elements
`,
      creative: `
- Use creative and innovative design patterns
- Implement unique visual elements
- Use bold colors and typography
- Focus on artistic expression
- Include creative animations and interactions
`,
      elegant: `
- Use sophisticated, refined design
- Implement polished, high-quality interfaces
- Use elegant typography and spacing
- Focus on luxury and premium feel
- Include subtle, refined animations
`
    };

    return styleInstructions[this.config.style!] || '';
  }

  private getComplexityInstructions(): string {
    const complexityInstructions = {
      simple: `
- Keep the project structure simple and straightforward
- Use basic features and functionality
- Focus on core functionality only
- Use simple, clean code patterns
- Minimize external dependencies
`,
      intermediate: `
- Use moderate project structure and features
- Include common functionality and patterns
- Add proper error handling and validation
- Use appropriate external libraries
- Implement proper state management
`,
      complex: `
- Use advanced project structure and architecture
- Include comprehensive functionality
- Add advanced features and integrations
- Use multiple external libraries and tools
- Implement complex state management and data flow
`,
      enterprise: `
- Use enterprise-grade architecture and patterns
- Include comprehensive functionality and features
- Add advanced security and performance optimizations
- Use enterprise-grade libraries and tools
- Implement complex business logic and workflows
- Add comprehensive testing and monitoring
`
    };

    return complexityInstructions[this.config.complexity!] || '';
  }

  private getFeatureInstructions(): string {
    const featureMap: Record<string, string> = {
      'authentication': `
- Implement proper user authentication system
- Add login/logout functionality
- Include user registration
- Add password reset functionality
- Implement proper session management
`,
      'database': `
- Add proper database integration
- Implement data models and schemas
- Add database migrations
- Include proper data validation
- Add database connection management
`,
      'api': `
- Implement RESTful API endpoints
- Add proper API documentation
- Include API versioning
- Add proper error handling
- Implement API rate limiting
`,
      'testing': `
- Add comprehensive test suite
- Include unit tests
- Add integration tests
- Include end-to-end tests
- Add test coverage reporting
`,
      'deployment': `
- Add deployment configuration
- Include Docker setup
- Add CI/CD pipeline
- Include environment configuration
- Add monitoring and logging
`,
      'responsive': `
- Implement responsive design
- Add mobile-first approach
- Include tablet and desktop layouts
- Add proper breakpoints
- Test on multiple devices
`,
      'accessibility': `
- Implement WCAG accessibility guidelines
- Add proper ARIA labels
- Include keyboard navigation
- Add screen reader support
- Test with accessibility tools
`,
      'performance': `
- Implement performance optimizations
- Add code splitting
- Include lazy loading
- Add caching strategies
- Monitor performance metrics
`,
      'security': `
- Implement security best practices
- Add input validation and sanitization
- Include CSRF protection
- Add rate limiting
- Implement proper authentication
`,
      'internationalization': `
- Add internationalization support
- Include multiple language support
- Add proper locale handling
- Include RTL language support
- Add translation management
`
    };

    return this.config.features!
      .map(feature => featureMap[feature.toLowerCase()] || '')
      .filter(instruction => instruction)
      .join('\n');
  }

  private getRequirementInstructions(): string {
    return `
Additional requirements:
${this.config.requirements!.map(req => `- ${req}`).join('\n')}
`;
  }

  // Static method to create a prompt builder with common configurations
  static createReactViteApp(description: string, options?: Partial<PromptConfig>): PromptBuilder {
    return new PromptBuilder({
      description,
      stack: 'react_vite',
      style: 'modern',
      complexity: 'intermediate',
      features: ['responsive', 'accessibility'],
      ...options
    });
  }

  static createFullStackApp(description: string, options?: Partial<PromptConfig>): PromptBuilder {
    return new PromptBuilder({
      description,
      stack: 'fullstack_react_node',
      style: 'modern',
      complexity: 'intermediate',
      features: ['authentication', 'database', 'api', 'responsive'],
      ...options
    });
  }

  static createMobileApp(description: string, options?: Partial<PromptConfig>): PromptBuilder {
    return new PromptBuilder({
      description,
      stack: 'mobile_react_native',
      style: 'modern',
      complexity: 'intermediate',
      features: ['responsive', 'accessibility'],
      ...options
    });
  }

  static createBackendAPI(description: string, options?: Partial<PromptConfig>): PromptBuilder {
    return new PromptBuilder({
      description,
      stack: 'nodejs_express',
      style: 'corporate',
      complexity: 'intermediate',
      features: ['api', 'database', 'authentication', 'testing'],
      ...options
    });
  }
}
