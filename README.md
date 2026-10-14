# CPO Conecta API

API REST para la app móvil **CPO Conecta**, construida con **Node.js + Express + TypeScript**,
usando **arquitectura por capas** (config, middlewares, validators, controllers, services,
repositories, exceptions) y **versionamiento de rutas** (`/api/v1`).

## 🗄️ Base de datos

Los datos se guardan en una base de datos real **SQLite** (vía [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)),
en un único archivo `data/cpo-conecta.db` que se crea automáticamente al arrancar el servidor.
A diferencia de una versión anterior de este MVP (que guardaba todo en memoria), **los datos
ahora persisten entre reinicios**: si registras un usuario o envías un mensaje de chat y
reinicias el servidor, siguen ahí.

- `src/config/schema.ts` — define las 3 tablas (`users`, `exams`, `chat_messages`) como SQL puro.
- `src/config/database.ts` — abre la conexión (un único `Database` compartido por toda la app)
  y expone `runMigrations()`, que crea las tablas si no existen (seguro de llamar en cada arranque).
- `src/repositories/*.ts` — son el **único** lugar que conoce SQL. Todas sus funciones
  (`findUserByUsername`, `findAllExams`, `appendMessage`, etc.) conservan exactamente la misma
  firma que tenían con el almacenamiento en memoria, así que controllers, services, middlewares
  y rutas no cambiaron ni una línea al migrar a una base de datos real — ese es el beneficio
  de tener la arquitectura separada por capas.

No se usa ningún ORM a propósito: las consultas SQL están escritas a mano en cada repositorio,
para que se vea exactamente qué hace cada una.

### Reiniciar la base de datos desde cero

```bash
npm run db:reset   # borra data/cpo-conecta.db; se vuelve a crear vacía en el próximo arranque
```

## 🧱 Arquitectura por capas

```
src/
├── config/         # Variables de entorno y constantes fijas (UNICA capa que lee process.env)
├── exceptions/      # Errores de aplicación tipados (ValidationError, UnauthorizedError, ...)
├── types/           # Interfaces TypeScript compartidas (User, Exam, ChatMessage)
├── validators/       # Schemas de validación de entrada (Zod)
├── middlewares/      # Piezas transversales: logger, validación, autenticación, errores, 404
├── repositories/     # Acceso a los datos (en memoria). No conocen Express ni reglas de negocio.
├── services/         # Reglas de negocio puras. No conocen `req`/`res`.
├── controllers/      # Traducen HTTP ↔ servicio. No contienen lógica de negocio.
├── routes/
│   ├── v1/           # Rutas de la versión 1 de la API
│   └── index.ts      # Monta cada versión bajo su propio prefijo
├── utils/            # jwt, hash de contraseñas, asyncHandler, generador de ids
├── app.ts            # Ensambla Express: middlewares + rutas (sin lógica propia)
└── server.ts         # Arranca el servidor HTTP
```

**Flujo de una petición:** `ruta → middlewares (auth/validación) → controller → service → repository`
**Flujo de un error:** cualquier capa lanza un `AppError` → `asyncHandler` lo atrapa → `errorHandler` responde.

## 🚀 Ejecutar

```bash
npm install
cp .env.example .env    # valores por defecto ya sirven para desarrollo
npm run dev              # http://localhost:4000
```

Al arrancar por primera vez, el servidor crea las tablas, el usuario de demostración
y los 4 exámenes de ejemplo. Como ahora hay una base de datos real, esto solo pasa
**una vez**: en los siguientes arranques, esos datos ya existen y no se duplican.

```
usuario:    carlos.mendoza385
contraseña: lab2026
```

Otros comandos:

```bash
npm run typecheck   # valida TypeScript sin generar archivos
npm run build        # compila a dist/
npm start            # ejecuta la version compilada (requiere build previo)
```

## 🔌 Endpoints (5 endpoints de negocio + 1 de salud)

Todas las respuestas tienen la forma `{ success: boolean, data }` o `{ success: false, error }`.

| # | Método | Ruta | Auth | Descripción |
|---|--------|------|------|-------------|
| — | GET | `/api/v1/health` | No | Verifica que el servidor esté corriendo |
| 1 | POST | `/api/v1/auth/register` | No | Registra un paciente nuevo y devuelve su token |
| 2 | POST | `/api/v1/auth/login` | No | Inicia sesión y devuelve el token (pantalla **Login**) |
| 3 | GET | `/api/v1/exams` | Sí (Bearer) | Lista los exámenes y el resumen por estado (pantalla **Home/Resultados**) |
| 4 | GET | `/api/v1/exams/:examId/pdf` | Sí (Bearer) | Info de descarga simulada del PDF (pantalla **Examen PDF**) |
| 5 | POST | `/api/v1/support/messages` | Sí (Bearer) | Envía un mensaje y recibe la respuesta del asistente (pantalla **Atención**) |

### Ejemplos con `curl`

```bash
# 1) Registro
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ana Torres","username":"ana.torres01","password":"clave1234"}'

# 2) Login (usuario de demostración)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"carlos.mendoza385","password":"lab2026"}'
# -> copiar el "token" de la respuesta y guardarlo en una variable:
TOKEN="pega_aqui_el_token"

# 3) Listar examenes
curl http://localhost:4000/api/v1/exams -H "Authorization: Bearer $TOKEN"

# 4) Info de PDF de un examen listo
curl http://localhost:4000/api/v1/exams/1/pdf -H "Authorization: Bearer $TOKEN"

# 5) Enviar un mensaje de chat
curl -X POST http://localhost:4000/api/v1/support/messages \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"¿Cuándo está lista mi glisemia?"}'
```

### Códigos de error

| Código HTTP | `error.code` | Cuándo ocurre |
|---|---|---|
| 400 | `VALIDATION_ERROR` | El body/params no cumplen el schema (incluye `details` con cada campo) |
| 401 | `UNAUTHORIZED` | Credenciales inválidas, o token ausente/inválido/expirado |
| 404 | `NOT_FOUND` | El examen solicitado no existe |
| 409 | `CONFLICT` | Usuario duplicado al registrarse, o PDF de un examen que aún no está listo |
| 404 | `ROUTE_NOT_FOUND` | La ruta no existe |
| 500 | `INTERNAL_SERVER_ERROR` | Error no controlado (no expone detalles internos al cliente) |

## 📱 Conexión con la app móvil (Expo)

La app React Native consume esta API desde `src/api/` (ver `src/constants/api.ts` en el
proyecto móvil). Como el teléfono/emulador no puede usar `localhost` para llegar a tu
computador, reemplaza `API_BASE_URL` por la IP local de tu máquina en la misma red Wi-Fi,
por ejemplo `http://192.168.1.10:4000/api/v1` (puedes verla con `ipconfig` en Windows).

## 🔐 Variables de entorno (`.env`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor | `4000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `JWT_SECRET` | Clave para firmar los tokens | *(cambiar en producción)* |
| `JWT_EXPIRES_IN` | Duración del token | `2h` |
| `BCRYPT_SALT_ROUNDS` | Costo del hash de contraseñas | `10` |
| `CORS_ORIGIN` | Origen permitido para CORS | `*` |
| `DATABASE_PATH` | Ruta del archivo SQLite | `./data/cpo-conecta.db` |
