import { createApp } from './app';
import { env } from './config/env';
import { ensureDemoUserExists } from './services/authService';

/**
 * Punto de arranque del servidor.
 * Separar este archivo de `app.ts` permite, por ejemplo, importar `createApp()`
 * desde pruebas automatizadas sin tener que levantar un puerto real.
 */
async function bootstrap(): Promise<void> {
  // Crea el usuario de demostracion para poder probar el login de inmediato.
  await ensureDemoUserExists();

  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`CPO Conecta API corriendo en http://localhost:${env.port}${'/api/v1'}`);
    // eslint-disable-next-line no-console
    console.log('Usuario de demostracion -> usuario: carlos.mendoza385 | contrasena: lab2026');
  });
}

bootstrap();
