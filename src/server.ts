import { createApp } from './app';
import { env } from './config/env';
import { runMigrations } from './config/database';
import { ensureDemoUserExists } from './services/authService';

/**
 * Punto de arranque del servidor.
 * Separar este archivo de `app.ts` permite, por ejemplo, importar `createApp()`
 * desde pruebas automatizadas sin tener que levantar un puerto real.
 */
async function bootstrap(): Promise<void> {
  // Crea las tablas de la base de datos si todavia no existen (seguro de repetir).
  runMigrations();

  // Carga el usuario de demostracion y sus examenes. Al estar respaldados por una
  // base de datos real, esto solo se inserta una vez: en los siguientes arranques
  // ya existiran y no se duplica.
  await ensureDemoUserExists();

  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`CPO Conecta API corriendo en http://localhost:${env.port}${'/api/v1'}`);
    // eslint-disable-next-line no-console
    console.log(`Base de datos SQLite en: ${env.databasePath}`);
    // eslint-disable-next-line no-console
    console.log('Usuario de demostracion -> usuario: carlos.mendoza385 | contrasena: lab2026');
  });
}

bootstrap();
