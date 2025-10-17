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
    <title>2Code - Projeto Demo</title>
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
      <header className="app-header">
        <h1 className="title">
          Bem-vindo ao <span className="gradient-text">2Code</span>
        </h1>
        <p className="subtitle">
          Crie projetos web incríveis com IA
        </p>
      </header>

      <main className="main-content">
        <div className="card">
          <h2>Projeto Demo</h2>
          <p>Este é um exemplo de projeto React + Vite</p>
          
          <div className="counter-section">
            <button 
              className="counter-btn"
              onClick={() => setCount((count) => count + 1)}
            >
              Contador: {count}
            </button>
          </div>

          <div className="features">
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <h3>Rápido</h3>
              <p>Vite oferece desenvolvimento ultra-rápido</p>
            </div>
            <div className="feature">
              <span className="feature-icon">⚛️</span>
              <h3>React</h3>
              <p>Framework moderno e poderoso</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🎨</span>
              <h3>Estilizado</h3>
              <p>Design limpo e responsivo</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Criado com 2Code - Transforme ideias em realidade</p>
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
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4rem 2rem 3rem;
  text-align: center;
  color: white;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem;
  animation: fadeInDown 0.6s ease-out;
}

.gradient-text {
  background: linear-gradient(45deg, #ffd89b, #19547b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.25rem;
  opacity: 0.95;
  margin: 0;
  animation: fadeInUp 0.6s ease-out;
}

.main-content {
  flex: 1;
  padding: 3rem 2rem;
  background: #f7fafc;
}

.card {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.8s ease-out;
}

.card h2 {
  font-size: 2rem;
  color: #2d3748;
  margin: 0 0 0.5rem;
}

.card > p {
  color: #718096;
  margin: 0 0 2rem;
}

.counter-section {
  margin: 2rem 0;
  text-align: center;
}

.counter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-weight: 600;
}

.counter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.counter-btn:active {
  transform: translateY(0);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature {
  text-align: center;
  padding: 2rem 1rem;
  border-radius: 12px;
  background: #f7fafc;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.feature h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0 0 0.5rem;
}

.feature p {
  color: #718096;
  margin: 0;
  font-size: 0.95rem;
}

.footer {
  background: #2d3748;
  color: white;
  text-align: center;
  padding: 2rem;
}

.footer p {
  margin: 0;
  opacity: 0.9;
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

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .card {
    padding: 2rem 1.5rem;
  }
  
  .features {
    grid-template-columns: 1fr;
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
}

#root {
  width: 100%;
}`
        }
      ]
    }
  ];
};
