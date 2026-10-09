import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // The framework code changes rarely but is most of the first download. Keeping it in chunks of its own
          // means a deploy that only touches the app leaves them cached in the browser.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[/\\](?:react|react-dom|scheduler)[/\\]/, priority: 30 },
              {
                name: 'vendor',
                test: /node_modules[/\\](?:react-router|react-router-dom|@tanstack[/\\]query-core|@tanstack[/\\]react-query|zustand)[/\\]/,
                priority: 20,
              },
            ],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
      },
    },
  }
})
