import type { FileNode } from '@/components/FileTree';

export const getExampleProject = (): FileNode[] => {
  return [
    {
      name: 'package.json',
      type: 'file',
      path: 'package.json',
      content: JSON.stringify({
        name: 'vite-react-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.66',
          '@types/react-dom': '^18.2.22',
          '@vitejs/plugin-react': '^4.2.1',
          vite: '^5.2.0'
        }
      }, null, 2)
    },
    {
      name: 'vite.config.js',
      type: 'file',
      path: 'vite.config.js',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
    },
    {
      name: 'index.html',
      type: 'file',
      path: 'index.html',
      content: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>2Code - AI Web Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
    },
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'main.jsx',
          type: 'file',
          path: 'src/main.jsx',
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        },
        {
          name: 'App.jsx',
          type: 'file',
          path: 'src/App.jsx',
          content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <div className="gradient-bg"></div>
      
      <header className="header">
        <nav className="nav">
          <div className="logo">2Code</div>
          <div className="nav-links">
            <a href="#features">Recursos</a>
            <a href="#demo">Demo</a>
            <a href="#about">Sobre</a>
          </div>
        </nav>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">
            Crie websites incríveis
            <br />
            <span className="gradient-text">com o poder da IA</span>
          </h1>
          <p className="hero-subtitle">
            Transforme suas ideias em realidade com geração inteligente de código.
            Rápido, moderno e totalmente personalizável.
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary">Começar Agora</button>
            <button className="btn btn-secondary">Ver Demo</button>
          </div>
        </section>

        <section id="demo" className="demo-section">
          <div className="card">
            <h2>Experimente o Contador</h2>
            <p className="card-subtitle">Um exemplo interativo construído com React</p>
            
            <div className="counter-display">
              <div className="counter-value">{count}</div>
              <p className="counter-label">cliques</p>
            </div>

            <div className="counter-buttons">
              <button 
                className="counter-btn decrement"
                onClick={() => setCount(count - 1)}
              >
                −
              </button>
              <button 
                className="counter-btn reset"
                onClick={() => setCount(0)}
              >
                Reset
              </button>
              <button 
                className="counter-btn increment"
                onClick={() => setCount(count + 1)}
              >
                +
              </button>
            </div>
          </div>
        </section>

        <section id="features" className="features-section">
          <h2 className="section-title">Por que escolher 2Code?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Ultra Rápido</h3>
              <p>Vite oferece HMR instantâneo e build otimizado para máxima performance</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚛️</div>
              <h3>React Moderno</h3>
              <p>Use o framework mais popular com hooks e componentes funcionais</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Design Responsivo</h3>
              <p>Layouts que se adaptam perfeitamente a qualquer dispositivo</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>IA Integrada</h3>
              <p>Gere código inteligente com apenas uma descrição do que precisa</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Totalmente Customizável</h3>
              <p>Edite e personalize cada detalhe do código gerado</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Deploy Rápido</h3>
              <p>Publique seu projeto com um clique em diversas plataformas</p>
            </div>
          </div>
        </section>

        <section id="about" className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">100+</div>
              <div className="stat-label">Projetos Criados</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">50+</div>
              <div className="stat-label">Usuários Ativos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99%</div>
              <div className="stat-label">Satisfação</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>2Code</h4>
            <p>Criando o futuro do desenvolvimento web</p>
          </div>
          <div className="footer-section">
            <h4>Links</h4>
            <a href="#features">Recursos</a>
            <a href="#demo">Demo</a>
            <a href="#about">Sobre</a>
          </div>
          <div className="footer-section">
            <h4>Contato</h4>
            <a href="#">suporte@2code.dev</a>
            <a href="#">Documentação</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 2Code. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App`
        },
        {
          name: 'App.css',
          type: 'file',
          path: 'src/App.css',
          content: `.app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.gradient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  opacity: 0.03;
  z-index: -1;
}

.header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: #2d3748;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #667eea;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero {
  text-align: center;
  padding: 8rem 2rem 6rem;
  animation: fadeInUp 0.8s ease-out;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 1.5rem;
  color: #1a202c;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 3s ease infinite;
  background-size: 200% 200%;
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #718096;
  max-width: 600px;
  margin: 0 auto 3rem;
  line-height: 1.6;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.demo-section {
  padding: 4rem 0;
  animation: fadeIn 1s ease-out;
}

.card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.card h2 {
  font-size: 2rem;
  color: #2d3748;
  margin: 0 0 0.5rem;
}

.card-subtitle {
  color: #718096;
  margin: 0 0 3rem;
}

.counter-display {
  margin: 2rem 0;
}

.counter-value {
  font-size: 5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.counter-label {
  color: #a0aec0;
  margin-top: 0.5rem;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
}

.counter-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.counter-btn {
  width: 80px;
  height: 80px;
  border: none;
  border-radius: 16px;
  font-size: 2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.counter-btn.increment {
  background: linear-gradient(135deg, #48bb78, #38a169);
}

.counter-btn.decrement {
  background: linear-gradient(135deg, #f56565, #e53e3e);
}

.counter-btn.reset {
  background: linear-gradient(135deg, #718096, #4a5568);
  font-size: 1rem;
}

.counter-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.counter-btn:active {
  transform: translateY(-2px);
}

.features-section {
  padding: 6rem 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.15);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  display: inline-block;
}

.feature-card h3 {
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0 0 1rem;
}

.feature-card p {
  color: #718096;
  line-height: 1.6;
  margin: 0;
}

.stats-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 4rem -2rem;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.stat-value {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.125rem;
  opacity: 0.9;
}

.footer {
  background: #1a202c;
  color: white;
  padding: 4rem 2rem 2rem;
  margin-top: 6rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-section h4 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.footer-section p {
  color: #a0aec0;
  margin: 0;
}

.footer-section a {
  display: block;
  color: #a0aec0;
  text-decoration: none;
  margin: 0.5rem 0;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0aec0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .nav-links {
    gap: 1rem;
  }

  .hero {
    padding: 4rem 1rem 3rem;
  }

  .card {
    padding: 2rem;
  }

  .counter-buttons {
    flex-direction: column;
    align-items: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-section {
    margin: 4rem 0;
  }
}`
        },
        {
          name: 'index.css',
          type: 'file',
          path: 'src/index.css',
          content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  color: #2d3748;
  background: #f7fafc;
}

#root {
  width: 100%;
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
}`
        }
      ]
    }
  ];
};
