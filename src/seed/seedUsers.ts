import type { ProfileFields } from '../types/user.types';

/** Usuario de prueba que se crea al arrancar el servidor (todos con contrasena "lab2026"). */
export interface SeedUser extends ProfileFields {
  fullName: string;
  username: string;
  /** Solo se usa para no asignar examenes que no aplican (ej. antigeno prostatico a una mujer). */
  sex: 'F' | 'M';
  /** Sede a la que el paciente suele ir (la mayoria de sus ordenes son ahi). */
  usualSite: string;
}

/** Contrasena de TODOS los usuarios de prueba. */
export const SEED_PASSWORD = 'lab2026';

/** 10 pacientes de prueba (datos ficticios). El primero es el usuario demo de siempre. */
export const SEED_USERS: SeedUser[] = [
  {
    fullName: 'Carlos Mendoza', username: 'carlos.mendoza385', sex: 'M', usualSite: 'Laureles',
    documentNumber: '1036654321', email: 'carlos.mendoza@correo.com', phone: '3001234567',
    address: 'Cra. 76 #33-20, Medellín', birthDate: '1990-04-15',
  },
  {
    fullName: 'María Fernanda López', username: 'maria.lopez214', sex: 'F', usualSite: 'El Poblado',
    documentNumber: '1037582946', email: 'maria.lopez@correo.com', phone: '3104567812',
    address: 'Cl. 10 #43A-15, Medellín', birthDate: '1985-11-02',
  },
  {
    fullName: 'Andrés Felipe Restrepo', username: 'andres.restrepo507', sex: 'M', usualSite: 'Belén',
    documentNumber: '71654238', email: 'andres.restrepo@correo.com', phone: '3157896543',
    address: 'Cra. 80 #28-45, Medellín', birthDate: '1972-06-23',
  },
  {
    fullName: 'Luisa Fernanda Gómez', username: 'luisa.gomez832', sex: 'F', usualSite: 'Envigado',
    documentNumber: '1152447890', email: 'luisa.gomez@correo.com', phone: '3012345678',
    address: 'Cl. 37 Sur #42-10, Envigado', birthDate: '1998-02-14',
  },
  {
    fullName: 'Juan David Ramírez', username: 'juan.ramirez119', sex: 'M', usualSite: 'Bello',
    documentNumber: '1017234561', email: 'juan.ramirez@correo.com', phone: '3206543210',
    address: 'Cra. 50 #45-30, Bello', birthDate: '1994-09-08',
  },
  {
    fullName: 'Valentina Ospina', username: 'valentina.ospina640', sex: 'F', usualSite: 'Laureles',
    documentNumber: '1000876543', email: 'valentina.ospina@correo.com', phone: '3168765432',
    address: 'Circular 4 #70-12, Medellín', birthDate: '2001-12-19',
  },
  {
    fullName: 'Santiago Herrera', username: 'santiago.herrera273', sex: 'M', usualSite: 'Centro',
    documentNumber: '98563214', email: 'santiago.herrera@correo.com', phone: '3005551234',
    address: 'Cl. 52 #49-28, Medellín', birthDate: '1966-03-30',
  },
  {
    fullName: 'Camila Arango', username: 'camila.arango958', sex: 'F', usualSite: 'El Poblado',
    documentNumber: '1036998877', email: 'camila.arango@correo.com', phone: '3117654321',
    address: 'Cra. 35 #8A-60, Medellín', birthDate: '1989-07-11',
  },
  {
    fullName: 'Jorge Iván Castaño', username: 'jorge.castano401', sex: 'M', usualSite: 'Itagüí',
    documentNumber: '70123456', email: 'jorge.castano@correo.com', phone: '3142223344',
    address: 'Cl. 51 #48-20, Itagüí', birthDate: '1958-10-05',
  },
  {
    fullName: 'Daniela Correa', username: 'daniela.correa766', sex: 'F', usualSite: 'Belén',
    documentNumber: '1035112233', email: 'daniela.correa@correo.com', phone: '3189990011',
    address: 'Cra. 76 #18-35, Medellín', birthDate: '1996-05-27',
  },
];
