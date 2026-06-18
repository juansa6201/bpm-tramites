// Global setup de los e2e: prepara el esquema de TEST (test_e2e) aplicando las
// migraciones de Prisma. Corre una sola vez, antes de todas las suites.
import { execSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { toTestSchemaUrl } from './test-db-url';

export default function globalSetup(): void {
  dotenv.config({ path: join(__dirname, '..', '.env') });
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL no definido (revisá api/.env)');

  const testUrl = toTestSchemaUrl(base);
  // migrate deploy crea el esquema test_e2e (si falta) y aplica las migraciones.
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}
