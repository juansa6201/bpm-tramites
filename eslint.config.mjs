// ESLint flat config (ESLint 9) — base compartida del monorepo.
// Cada app (api/ y web/) extiende esta base con reglas propias de su framework.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Archivos y carpetas que ESLint nunca debe analizar
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
    ],
  },

  // Reglas base recomendadas de JS y TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Entornos: Node (backend) y navegador (frontend)
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // Reglas comunes del proyecto
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // IMPORTANTE: debe ir último para desactivar reglas que chocan con Prettier
  prettier,
);
