import { db } from '../config/database';
import { getMetaValue, setMetaValue } from '../repositories/metaRepository';
import { createOrderWithExams, deleteAllOrders } from '../repositories/orderRepository';
import { createUser, findUserByUsername, updateUserProfile } from '../repositories/userRepository';
import { hashPassword } from '../utils/password';
import { generateOrdersForPatient, type GeneratedOrder } from './orderGenerator';
import { SEED_PASSWORD, SEED_USERS } from './seedUsers';

/**
 * Version de los datos de prueba. Si se cambian los datos de este archivo (o del catalogo),
 * se sube este numero y, al arrancar, el servidor vuelve a generar todas las ordenes.
 */
const SEED_VERSION = '2';
const SEED_VERSION_KEY = 'seed_version';

/** Crea los 10 pacientes de prueba que falten y completa su perfil si esta vacio. */
async function ensureSeedUsers(): Promise<string[]> {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  return SEED_USERS.map(({ sex: _sex, usualSite: _site, ...seedUser }) => {
    const user =
      findUserByUsername(seedUser.username) ??
      createUser({ fullName: seedUser.fullName, username: seedUser.username, passwordHash });

    // Solo se llena el perfil si esta vacio, para no pisar cambios hechos desde la app.
    if (!user.documentNumber) {
      updateUserProfile(user.id, { ...seedUser, fullName: user.fullName });
    }
    return user.id;
  });
}

/**
 * Carga los datos de prueba al arrancar el servidor:
 * 10 pacientes (contrasena "lab2026"), cada uno con 5 a 8 ordenes de 8 a 13 examenes.
 *
 * Las ordenes de TODOS los pacientes se guardan juntas en orden cronologico, asi el
 * numero de orden consecutivo queda ordenado por fecha en todo el sistema
 * (una orden mas reciente siempre tiene un numero mayor).
 *
 * Es seguro llamarla en cada arranque: si la version de los datos ya esta cargada,
 * solo verifica que existan los usuarios. Si la version cambio (o la base de datos tenia
 * ordenes de una version anterior), borra TODAS las ordenes y las vuelve a generar.
 */
export async function seedDatabase(): Promise<void> {
  const userIds = await ensureSeedUsers();

  if (getMetaValue(SEED_VERSION_KEY) === SEED_VERSION) return;

  const allOrders: (GeneratedOrder & { userId: string })[] = SEED_USERS.flatMap((patient, index) =>
    generateOrdersForPatient(index, patient).map((order) => ({ ...order, userId: userIds[index] })),
  );
  allOrders.sort((a, b) => a.date.localeCompare(b.date));

  db.transaction(() => {
    deleteAllOrders();
    allOrders.forEach(({ userId, ...order }) => createOrderWithExams(userId, order));
    setMetaValue(SEED_VERSION_KEY, SEED_VERSION);
  })();

  // eslint-disable-next-line no-console
  console.log(`Datos de prueba cargados: ${SEED_USERS.length} pacientes, ${allOrders.length} ordenes.`);
}
