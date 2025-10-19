import { ProjectStack } from './systemPrompts';

interface StackDetectionRule {
  keywords: string[];
  stack: ProjectStack;
  confidence: number;
  description: string;
}

const STACK_DETECTION_RULES: StackDetectionRule[] = [
  // Mobile Apps
  {
    keywords: ['app móvel', 'mobile app', 'aplicativo', 'celular', 'smartphone', 'ios', 'android', 'react native', 'flutter'],
    stack: 'mobile_react_native',
    confidence: 0.9,
    description: 'Aplicação móvel detectada'
  },
  {
    keywords: ['flutter', 'dart'],
    stack: 'mobile_flutter',
    confidence: 0.95,
    description: 'App Flutter detectado'
  },

  // Desktop Apps
  {
    keywords: ['desktop', 'aplicação desktop', 'app desktop', 'electron', 'tauri'],
    stack: 'desktop_electron',
    confidence: 0.9,
    description: 'Aplicação desktop detectada'
  },
  {
    keywords: ['tauri', 'rust'],
    stack: 'desktop_tauri',
    confidence: 0.95,
    description: 'App Tauri detectado'
  },

  // Backend APIs
  {
    keywords: ['api', 'backend', 'servidor', 'endpoint', 'rest api', 'graphql', 'express', 'fastify'],
    stack: 'nodejs_express',
    confidence: 0.8,
    description: 'API backend detectada'
  },
  {
    keywords: ['fastapi', 'python api', 'django', 'flask'],
    stack: 'python_fastapi',
    confidence: 0.9,
    description: 'API Python detectada'
  },
  {
    keywords: ['fastify', 'node fastify'],
    stack: 'nodejs_fastify',
    confidence: 0.85,
    description: 'API Fastify detectada'
  },

  // Full-stack Applications
  {
    keywords: ['e-commerce', 'plataforma', 'sistema completo', 'full-stack', 'aplicação completa', 'dashboard', 'admin panel'],
    stack: 'fullstack_react_node',
    confidence: 0.8,
    description: 'Aplicação full-stack detectada'
  },
  {
    keywords: ['vue full-stack', 'vue + node', 'vue + express'],
    stack: 'fullstack_vue_express',
    confidence: 0.9,
    description: 'Full-stack Vue detectado'
  },

  // Frontend Frameworks
  {
    keywords: ['next.js', 'nextjs', 'ssr', 'ssg', 'server-side'],
    stack: 'react_nextjs',
    confidence: 0.9,
    description: 'Next.js detectado'
  },
  {
    keywords: ['vue', 'vue.js', 'vuejs', 'nuxt'],
    stack: 'vue_vite',
    confidence: 0.8,
    description: 'Vue.js detectado'
  },
  {
    keywords: ['svelte', 'sveltekit'],
    stack: 'svelte_vite',
    confidence: 0.9,
    description: 'Svelte detectado'
  },

  // Default to React + Vite
  {
    keywords: ['react', 'frontend', 'landing page', 'website', 'site', 'página', 'interface'],
    stack: 'react_vite',
    confidence: 0.6,
    description: 'Frontend React detectado'
  }
];

export class StackDetector {
  static detectStack(description: string): {
    stack: ProjectStack;
    confidence: number;
    reason: string;
  } {
    const normalizedDescription = description.toLowerCase();
    
    // Find the best matching rule
    let bestMatch = {
      stack: 'react_vite' as ProjectStack,
      confidence: 0,
      reason: 'Padrão: React + Vite'
    };

    for (const rule of STACK_DETECTION_RULES) {
      const matchedKeywords = rule.keywords.filter(keyword => 
        normalizedDescription.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        // Calculate confidence based on number of matched keywords
        const keywordConfidence = Math.min(matchedKeywords.length / rule.keywords.length, 1);
        const finalConfidence = rule.confidence * keywordConfidence;

        if (finalConfidence > bestMatch.confidence) {
          bestMatch = {
            stack: rule.stack,
            confidence: finalConfidence,
            reason: `${rule.description} (${matchedKeywords.join(', ')})`
          };
        }
      }
    }

    return bestMatch;
  }

  static getStackSuggestions(description: string): Array<{
    stack: ProjectStack;
    confidence: number;
    reason: string;
  }> {
    const normalizedDescription = description.toLowerCase();
    const suggestions: Array<{
      stack: ProjectStack;
      confidence: number;
      reason: string;
    }> = [];

    for (const rule of STACK_DETECTION_RULES) {
      const matchedKeywords = rule.keywords.filter(keyword => 
        normalizedDescription.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        const keywordConfidence = Math.min(matchedKeywords.length / rule.keywords.length, 1);
        const finalConfidence = rule.confidence * keywordConfidence;

        suggestions.push({
          stack: rule.stack,
          confidence: finalConfidence,
          reason: `${rule.description} (${matchedKeywords.join(', ')})`
        });
      }
    }

    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  static getStackInfo(stack: ProjectStack): {
    name: string;
    description: string;
    icon: string;
    category: string;
  } {
    const stackInfo = {
      react_vite: { name: 'React + Vite', description: 'Frontend React com Vite', icon: '⚛️', category: 'Frontend' },
      react_nextjs: { name: 'Next.js', description: 'React com Next.js (SSR/SSG)', icon: '▲', category: 'Frontend' },
      vue_vite: { name: 'Vue + Vite', description: 'Frontend Vue com Vite', icon: '💚', category: 'Frontend' },
      svelte_vite: { name: 'Svelte + Vite', description: 'Frontend Svelte com Vite', icon: '🧡', category: 'Frontend' },
      nodejs_express: { name: 'Node.js + Express', description: 'Backend API com Express', icon: '🟢', category: 'Backend' },
      nodejs_fastify: { name: 'Node.js + Fastify', description: 'Backend API com Fastify', icon: '🚀', category: 'Backend' },
      python_fastapi: { name: 'Python + FastAPI', description: 'Backend API com FastAPI', icon: '🐍', category: 'Backend' },
      python_flask: { name: 'Python + Flask', description: 'Backend API com Flask', icon: '🌶️', category: 'Backend' },
      fullstack_react_node: { name: 'Full-stack React + Node', description: 'Aplicação completa React + Node.js', icon: '⚛️🟢', category: 'Full-stack' },
      fullstack_vue_express: { name: 'Full-stack Vue + Node', description: 'Aplicação completa Vue + Node.js', icon: '💚🟢', category: 'Full-stack' },
      mobile_react_native: { name: 'React Native', description: 'App móvel com React Native', icon: '📱', category: 'Mobile' },
      mobile_flutter: { name: 'Flutter', description: 'App móvel com Flutter', icon: '🦋', category: 'Mobile' },
      desktop_electron: { name: 'Electron', description: 'App desktop com Electron', icon: '⚡', category: 'Desktop' },
      desktop_tauri: { name: 'Tauri', description: 'App desktop com Tauri', icon: '🦀', category: 'Desktop' }
    };

    return stackInfo[stack];
  }
}
