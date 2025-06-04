/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/test.js'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/react/**/*',
      '.{idea,git,cache,output,temp}/**'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/react/**',
        'vitest.config.js',
        'config/**',
        'scripts/**'
      ]
    }
  }
}) 