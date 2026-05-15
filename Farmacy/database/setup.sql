-- ══════════════════════════════════════════════════════════
--  FARMACY — Setup inicial de PostgreSQL
--
--  PASO 1: psql -U postgres  →  \i database/setup.sql
--  PASO 2: Prisma genera el schema y lo aplica
-- ══════════════════════════════════════════════════════════

-- 1. Usuario y base de datos
CREATE USER farmacy_user WITH PASSWORD 'farmacy_pass';

CREATE DATABASE farmacy_db
  OWNER     = farmacy_user
  ENCODING  = 'UTF8'
  LC_COLLATE = 'es_CO.UTF-8'
  LC_CTYPE   = 'es_CO.UTF-8'
  TEMPLATE  = template0;
-- Si el locale es_CO no está disponible usa en_US.UTF-8

GRANT ALL PRIVILEGES ON DATABASE farmacy_db TO farmacy_user;

-- ──────────────────────────────────────────────────────────
-- Conéctate ahora: \c farmacy_db farmacy_user
-- ──────────────────────────────────────────────────────────

-- 2. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Enum de rol (Prisma lo crea, pero aquí como referencia)
-- CREATE TYPE "RolEmpleado" AS ENUM ('ADMINISTRADOR', 'FARMACEUTA', 'AUXILIAR');

-- ══════════════════════════════════════════════════════════
--  IMPORTANTE: Las tablas las crea Prisma con:
--
--    cd backend
--    npm run db:generate   ← genera el cliente TypeScript
--    npm run db:push       ← aplica schema.prisma a la BD
--    npm run db:seed       ← inserta datos iniciales
--
--  Flujo completo de desarrollo:
--
--  1. docker-compose -f docker-compose.dev.yml up -d
--       (levanta PostgreSQL en localhost:5432 y Redis en 6379)
--
--  2. cp .env.example .env
--       (rellena DATABASE_URL y los secrets JWT)
--
--  3. cd backend && npm install
--  4. npm run db:generate
--  5. npm run db:push
--  6. npm run db:seed
--
--  7. npm run dev             ← backend en localhost:3001
--  8. cd ../frontend && npm install && npm run dev
--       ← tienda en localhost:5173
-- ══════════════════════════════════════════════════════════

-- 4. Verificar que todo esté bien:
SELECT current_database(), current_user, version();
