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

- `src/config/schema.ts` — define las 4 tablas (`users`, `orders`, `exams`, `chat_messages`) como SQL puro.
  Una **orden** agrupa los exámenes de una misma visita al laboratorio: tiene un número de 6 dígitos
  (ej. `#546237`, único en el sistema), la fecha (`YYYY-MM-DD`) y la sede. **Un paciente solo puede
  tener una orden por día** (`UNIQUE (user_id, order_date)`). Cada examen pertenece a una orden, y a
  través de ella a un único paciente: un usuario nunca puede ver ni descargar el examen de otro (pedir
  el examen de otro paciente responde 404, no 403, para no revelar que existe).
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
├── repositories/     # Acceso a los datos (SQL sobre SQLite). No conocen Express ni reglas de negocio.
├── services/         # Reglas de negocio puras. No conocen `req`/`res`.
├── controllers/      # Traducen HTTP ↔ servicio. No contienen lógica de negocio.
├── routes/
│   ├── v1/           # Rutas de la versión 1 de la API
│   └── index.ts      # Monta cada versión bajo su propio prefijo
├── utils/            # jwt, hash de contraseñas, asyncHandler, nombres de archivo seguros, token biométrico
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

Al arrancar por primera vez, el servidor crea las tablas y carga los **datos de prueba**
(carpeta `src/seed/`). Esto solo pasa **una vez**: en los siguientes arranques ya existen y no se duplican.

- **10 pacientes**, todos con la contraseña `lab2026` (lista completa en `src/seed/seedUsers.ts`):
  `carlos.mendoza385`, `maria.lopez214`, `andres.restrepo507`, `luisa.gomez832`, `juan.ramirez119`,
  `valentina.ospina640`, `santiago.herrera273`, `camila.arango958`, `jorge.castano401`, `daniela.correa766`.
- Cada paciente tiene **entre 5 y 8 órdenes** y cada orden **entre 8 y 13 exámenes** tomados del
  catálogo `src/seed/examCatalog.ts` (los exámenes específicos por sexo solo se asignan a quien aplica).
- La orden más reciente de cada paciente tiene exámenes listos, en proceso y con novedad; las
  anteriores ya están casi todas listas.
- **Números de orden consecutivos:** la primera orden recibe un número aleatorio de 6 cifras y cada
  orden siguiente el número siguiente (máximo + 1), en orden cronológico. Una orden más reciente
  siempre tiene un número mayor. Las órdenes nuevas (ej. al registrarse) continúan la secuencia.
- Las fechas, sedes y exámenes se generan con una semilla fija, así que todo el equipo ve los mismos
  datos; solo cambia el número de orden inicial.
- Si se modifican los datos de prueba, se sube `SEED_VERSION` en `src/seed/seedDatabase.ts`: al
  arrancar, el servidor borra todas las órdenes y las vuelve a generar (los usuarios no se borran).

Cualquier paciente que se registre (`POST /auth/register`) arranca con una orden de la fecha de hoy
con 8 exámenes en estado `processing`.

Otros comandos:

```bash
npm run typecheck   # valida TypeScript sin generar archivos
npm run build        # compila a dist/
npm start            # ejecuta la version compilada (requiere build previo)
```

## 🔌 Endpoints (5 endpoints de negocio + descarga de archivo + salud)

Todas las respuestas tienen la forma `{ success: boolean, data }` o `{ success: false, error }`,
excepto la descarga del PDF, que devuelve el archivo binario directamente.

| # | Método | Ruta | Auth | Descripción |
|---|--------|------|------|-------------|
| — | GET | `/api/v1/health` | No | Verifica que el servidor esté corriendo |
| 1 | POST | `/api/v1/auth/register` | No | Registra un paciente nuevo con sus datos personales obligatorios (`documentNumber`, `birthDate` AAAA-MM-DD, `phone`, `email`, `address`), le crea una orden de hoy con 8 exámenes y devuelve su token |
| 2 | POST | `/api/v1/auth/login` | No | Inicia sesión y devuelve el token (pantalla **Login**) |
| 3 | GET | `/api/v1/exams` | Sí (Bearer) | Lista **todos los exámenes del paciente autenticado** y el resumen por estado (pantalla **Examen PDF**) |
| 3b | GET | `/api/v1/orders` | Sí (Bearer) | Todas las órdenes del paciente (más reciente primero), cada una con sus exámenes y su resumen |
| 3c | GET | `/api/v1/orders/latest` | Sí (Bearer) | Solo la orden más reciente con sus exámenes y su resumen (pantalla **Inicio**). `data: null` si no tiene órdenes |
| 3d | GET | `/api/v1/orders/:orderNumber/pdf/file` | Sí (Bearer) | **Un solo PDF por orden** con todos sus exámenes validados (los pendientes no se incluyen; el PDF dice cuántos faltan). 404 si la orden no es del paciente, 409 si aún no tiene exámenes validados (pantalla **Examen PDF**) |
| 4 | GET | `/api/v1/exams/:examId/pdf` | Sí (Bearer) | Metadatos de descarga del PDF (pantalla **Examen PDF**) |
| 4b | GET | `/api/v1/exams/:examId/pdf/file` | Sí (Bearer) | El archivo PDF real (bytes), generado con `pdf-lib` |
| 6 | GET | `/api/v1/profile` | Sí (Bearer) | Perfil completo del paciente: nombre, usuario, documento, fecha de nacimiento, celular, correo y dirección (pantalla **Perfil**) |
| 7 | PATCH | `/api/v1/profile` | Sí (Bearer) | Actualiza nombre y datos de contacto (un campo vacío lo borra). Devuelve el perfil actualizado |
| 8 | PATCH | `/api/v1/profile/password` | Sí (Bearer) | Cambia la contraseña: `{ currentPassword, newPassword }` |
| 9 | POST | `/api/v1/auth/biometric/enroll` | Sí (Bearer) | Activa el ingreso biométrico en este dispositivo. Pide `{ password, deviceName? }` y devuelve `{ deviceToken, expiresAt }` |
| 10 | POST | `/api/v1/auth/biometric/login` | No | Inicia sesión con `{ deviceToken }`. Devuelve `{ user, token, deviceToken, expiresAt }` con un `deviceToken` **nuevo** |
| 11 | POST | `/api/v1/auth/biometric/revoke` | No | Desactiva el ingreso biométrico de ese dispositivo con `{ deviceToken, reason? }`. Siempre responde 204 |
| 5b | GET | `/api/v1/support/messages` | Sí (Bearer) | Historial de la conversación del paciente (últimos 100 mensajes, en orden cronológico) |
| 5b | GET | `/api/v1/support/messages` | Sí (Bearer) | Historial de la conversación del paciente (últimos 100 mensajes, en orden cronológico) |
| 5 | POST | `/api/v1/support/messages` | Sí (Bearer) | Envía un mensaje y recibe la respuesta del asistente (pantalla **Atención**). Con `GEMINI_API_KEY` responde la IA con los datos de las órdenes del paciente; sin clave o si la IA falla, responde el asistente por palabras clave. Máximo 8 mensajes por minuto (429) |

### Ejemplos con `curl`

```bash
# 1) Registro (crea al paciente con 2 examenes propios en estado "processing")
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ana Torres","username":"ana.torres01","password":"clave1234","documentNumber":"1037111222","birthDate":"1999-02-28","phone":"3001112233","email":"ana@correo.com","address":"Cl. 10 #20-30, Medellin"}'

# 2) Login (usuario de demostración)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"carlos.mendoza385","password":"lab2026"}'
# -> copiar el "token" de la respuesta y guardarlo en una variable:
TOKEN="pega_aqui_el_token"

# 3b) Mi orden mas reciente (la que muestra el Inicio de la app)
curl http://localhost:4000/api/v1/orders/latest -H "Authorization: Bearer $TOKEN"

# 3) Listar MIS examenes (los ids son generados, copia uno de la respuesta anterior)
curl http://localhost:4000/api/v1/exams -H "Authorization: Bearer $TOKEN"
EXAM_ID="pega_aqui_un_id_de_examen_en_estado_ready"

# 4) Metadatos de descarga de un examen listo
curl http://localhost:4000/api/v1/exams/$EXAM_ID/pdf -H "Authorization: Bearer $TOKEN"

# 4b) Descargar el PDF real a un archivo
curl http://localhost:4000/api/v1/exams/$EXAM_ID/pdf/file \
  -H "Authorization: Bearer $TOKEN" -o resultado.pdf

# 5) Enviar un mensaje de chat
curl -X POST http://localhost:4000/api/v1/support/messages \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"¿Cuándo está lista mi glisemia?"}'
```

## 🔐 Seguridad del inicio de sesión

**Bloqueo por intentos fallidos.** Después de 5 contraseñas incorrectas seguidas para un mismo usuario,
el ingreso con contraseña de ese usuario se bloquea 15 minutos (respuesta 429), aunque luego se escriba
la contraseña correcta. Se aplica igual si el usuario no existe, para no revelar qué usuarios existen.
También se compara la contraseña contra un hash de relleno cuando el usuario no existe, para que la
respuesta tarde lo mismo. Constantes en `src/config/constants.ts`.

**Ingreso biométrico con credencial de dispositivo** (`src/services/biometricAuthService.ts`):

1. Con la sesión abierta, el paciente confirma su contraseña y el servidor crea un token aleatorio de
   256 bits para ese celular (`dc_<uuid>.<secreto>`). En la base de datos solo se guarda el SHA-256 del secreto.
2. La app guarda el token cifrado (Keystore / Keychain) y solo lo usa después de verificar la huella o el
   rostro. La contraseña nunca se guarda en el celular.
3. En cada ingreso biométrico el token se **rota**: el servidor entrega uno nuevo y revoca el anterior.
4. Si vuelve a llegar un token ya rotado (posible copia robada), se revocan **todas** las credenciales del
   paciente.
5. Un token vence a los 30 días sin usarse. Cambiar la contraseña revoca todos los dispositivos.

### Códigos de error

| Código HTTP | `error.code` | Cuándo ocurre |
|---|---|---|
| 400 | `VALIDATION_ERROR` | El body/params no cumplen el schema (incluye `details` con cada campo) |
| 401 | `SESSION_INVALID` | El token de sesión falta, venció o no es válido (la app vuelve al login) |
| 401 | `SESSION_INVALID` | El token de sesión falta, venció o no es válido (la app vuelve al login) |
| 401 | `UNAUTHORIZED` | Credenciales inválidas, o token ausente/inválido/expirado |
| 404 | `NOT_FOUND` | El examen no existe, o pertenece a otro paciente (a propósito no se distingue) |
| 429 | `TOO_MANY_REQUESTS` | Se superaron los 5 intentos fallidos de contraseña (bloqueo de 15 minutos) |
| 409 | `CONFLICT` | Usuario o número de documento duplicado al registrarse (o documento de otra cuenta en el Perfil), o PDF de un examen que aún no está listo |
| 404 | `ROUTE_NOT_FOUND` | La ruta no existe |
| 500 | `INTERNAL_SERVER_ERROR` | Error no controlado (no expone detalles internos al cliente) |

## 🤖 Asistente con IA del chat (Google Gemini)

El chat de la pantalla **Atención** lo atiende **Polito**, el pingüino mascota del CPO, y puede responder con IA. **No hay que entrenar nada**: en cada mensaje
el servidor le envía al modelo unas instrucciones fijas (qué puede y qué no puede decir) y los datos
de las órdenes del paciente, y el modelo responde a partir de eso.

**Activarlo:**
1. Crear una clave gratis en [Google AI Studio](https://aistudio.google.com/apikey).
2. Pegarla en el `.env` del servidor: `GEMINI_API_KEY=tu-clave`.
3. Reiniciar el servidor (`npm run dev`).

**Cómo funciona** (`src/services/assistant/`):
- `assistantPrompt.ts` — personalidad de Polito y reglas del asistente + datos del paciente + historial reciente (últimos 12 mensajes).
- `geminiClient.ts` — única pieza que habla con Gemini (cambiar de proveedor = cambiar este archivo).
- `keywordAssistant.ts` — respaldo por palabras clave si no hay clave, si no hay internet, si se agota la cuota o si la IA tarda más de 8 s.
- `chatRateLimiter.ts` — máximo 8 mensajes por minuto por paciente, para proteger la cuota.

**Seguridad y privacidad:**
- La clave vive **solo en el servidor**; la app nunca la conoce.
- A la IA solo se envía el **primer nombre** y las órdenes (examen y estado). No se envían documento,
  teléfono, correo, dirección ni fecha de nacimiento.
- El asistente no conoce valores de resultados y tiene prohibido interpretarlos, diagnosticar o recetar.
- ⚠️ En el plan **gratuito** Google puede usar los mensajes para mejorar sus productos. Sirve para este
  proyecto académico (pacientes de prueba); **con pacientes reales** se debe usar el plan de pago o un
  proveedor que no use los datos para entrenar.

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
| `JWT_SECRET` | Clave para firmar los tokens. **En producción es obligatoria** (mín. 32 caracteres y distinta a la de ejemplo) o el servidor no arranca | *(solo desarrollo)* |
| `JWT_EXPIRES_IN` | Duración del token | `2h` |
| `BCRYPT_SALT_ROUNDS` | Costo del hash de contraseñas | `10` |
| `CORS_ORIGIN` | Orígenes permitidos para CORS: `*` o lista separada por comas. **En producción no se permite `*`** | `*` en desarrollo |
| `DATABASE_PATH` | Ruta del archivo SQLite | `./data/cpo-conecta.db` |
| `GEMINI_API_KEY` | Clave de Google Gemini para el asistente con IA del chat. **Opcional**: sin clave, el chat responde por palabras clave. Solo va en el `.env` del servidor | *(vacía)* |
| `GEMINI_MODEL` | Modelo de Gemini que usa el chat | `gemini-3.5-flash-lite` |
