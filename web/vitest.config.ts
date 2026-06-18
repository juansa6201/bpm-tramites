import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Raíz del proyecto web (con slash final).
const root = fileURLToPath(new URL('./', import.meta.url));

// Vitest para componentes/páginas del front. jsdom + Testing Library.
// Alias explícito `@/` → raíz (regex, NO toca `@mui`/`@testing-library`): es la
// forma confiable de que `vi.mock('@/...')` resuelva al mismo módulo que importa
// el componente (el plugin de paths no alcanza para interceptar los mocks).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: root }],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
});
