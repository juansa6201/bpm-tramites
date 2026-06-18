// Carga el .env local de la API y APUNTA los e2e a un esquema de TEST aislado,
// antes de instanciar Prisma/Nest en los tests.
import * as dotenv from 'dotenv';
import { join } from 'path';
import { toTestSchemaUrl } from './test-db-url';

dotenv.config({ path: join(__dirname, '..', '.env') });

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = toTestSchemaUrl(process.env.DATABASE_URL);
}
