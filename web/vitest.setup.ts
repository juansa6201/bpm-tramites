import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta el árbol entre tests para que no se pisen (jsdom es compartido).
afterEach(() => {
  cleanup();
});
