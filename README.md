# ElVive Backend

API Node.js (Express + Prisma) para la iglesia ÉL VIVE. Migrado desde Laravel.

## Stack

- **Node.js 20** + Express
- **Prisma** + MySQL
- **JWT** para autenticación
- **Multer** para uploads

## Requisitos

- Node.js 20+
- MySQL (o compatibles: MariaDB, Aiven, etc.)

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="tu-secreto-jwt"
PORT=8000
```

## Instalación

```bash
npm install
npx prisma generate
```

## Desarrollo

```bash
npm run dev
```

El servidor corre en `http://localhost:8000`.

## Migraciones

```bash
# Aplicar migraciones
npx prisma migrate deploy

# Crear usuario inicial (opcional)
node scripts/seed-user.js
```

## API

### Públicas (sin auth)

- `GET /public/config/home` - Config home para frontend
- `GET /public/config/contact` - Config contacto
- `GET /public/config/layout` - Config layout/navegación
- `GET /public/config/ministries` - Lista ministerios
- `GET /public/config/ministries/:id` - Detalle ministerio
- `GET /public/config/meeting-days` - Config días de reunión
- `GET /public/events/upcoming` - Eventos próximos
- `GET /public/events/calendar` - Eventos calendario

### Auth

- `POST /auth/login` - Login (retorna JWT)
- `POST /auth/users` - Crear usuario (superadmin)

### API BackOffice (JWT requerido)

Ver rutas en `src/routes/api.js`. Prefijo `/api`.

### Health

- `GET /up` - Health check
- `GET /api/health` - Estado API

## Despliegue en Render

Ver **[RENDER_DEPLOY.md](RENDER_DEPLOY.md)** para instrucciones.

## Migración desde Laravel

Si migras desde una base Laravel existente, las tablas son compatibles. Cambia las variables de entorno:

- `DATABASE_URL` en lugar de `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- Formato: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

Puedes eliminar los archivos PHP/Laravel: `app/`, `bootstrap/`, `config/`, `database/migrations`, `routes/`, `vendor/`, etc.

## Licencia

MIT
