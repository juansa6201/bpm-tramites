// Carga el .env local de la API antes de instanciar Prisma/Nest en los tests.
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '..', '.env') });
