import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/**
 * Cliente Prisma usable tanto fuera como dentro de una transacción.
 * Permite que un mismo repositorio funcione standalone (PrismaService) o
 * ligado a una transacción (Prisma.TransactionClient).
 */
export type PrismaClientLike = PrismaService | Prisma.TransactionClient;
