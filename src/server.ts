import { createApp } from './app';
import { env } from './config/env';
import { runMigrations } from './config/database';
import { seedDatabase } from './seed/seedDatabase';

/**
 * Punto de arranque del servidor.
 * Separar este archivo de `app.ts` permite, por ejemplo, importar `createApp()`
 * desde pruebas automatizadas sin tener que levantar un puerto real.
 */
async function bootstrap(): Promise<void> {
  // Crea las tablas de la base de datos si todavia no existen (seguro de repetir).
  runMigrations();

  // Carga los 10 pacientes de prueba con sus ordenes y examenes (ver src/seed/).
  // Solo se insertan una vez: en los siguientes arranques ya existen y no se duplican.
  await seedDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`CPO Conecta API corriendo en http://localhost:${env.port}${'/api/v1'}`);
    // eslint-disable-next-line no-console
    console.log(`Base de datos SQLite en: ${env.databasePath}`);
    // eslint-disable-next-line no-console
    console.log('Usuarios de prueba (ver src/seed/seedUsers.ts) -> ej. carlos.mendoza385 | contrasena: lab2026');
  });
}

bootstrap();
