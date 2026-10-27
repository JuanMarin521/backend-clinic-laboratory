/**
 * Catalogo de examenes de laboratorio que se usan para generar los datos de prueba.
 *
 * - `weight`: que tan frecuente es el examen (3 = muy comun, 1 = poco comun). Los examenes
 *   mas comunes aparecen en mas ordenes, como pasa en un laboratorio real.
 * - `sex`: si el examen solo aplica a mujeres ('F') u hombres ('M'). Sin `sex` aplica a todos.
 */
export interface CatalogExam {
  name: string;
  weight: number;
  sex?: 'F' | 'M';
}

export const EXAM_CATALOG: CatalogExam[] = [
  // Hematologia
  { name: 'Hemograma', weight: 3 },
  { name: 'Hemoglobina', weight: 2 },
  { name: 'Hematocrito', weight: 2 },
  { name: 'Velocidad de sedimentación globular', weight: 2 },
  { name: 'Tiempo de protrombina', weight: 1 },
  { name: 'Tiempo de tromboplastina', weight: 1 },
  { name: 'Fibrinógeno', weight: 1 },
  { name: 'Hemoclasificación', weight: 1 },

  // Glucosa y diabetes
  { name: 'Glucosa en suero', weight: 3 },
  { name: 'Hemoglobina glicosilada', weight: 2 },
  { name: 'Prueba de tolerancia a la glucosa (curva)', weight: 1 },

  // Funcion renal
  { name: 'Creatinina en suero', weight: 3 },
  { name: 'Nitrógeno ureico', weight: 2 },
  { name: 'Ácido úrico', weight: 2 },
  { name: 'Urea', weight: 1 },

  // Perfil lipidico (cada examen por separado)
  { name: 'Colesterol total', weight: 3 },
  { name: 'Colesterol HDL', weight: 3 },
  { name: 'Colesterol LDL', weight: 3 },
  { name: 'Triglicéridos', weight: 3 },

  // Funcion hepatica
  { name: 'Fosfatasa alcalina (FA)', weight: 1 },
  { name: 'Gama glutamil transferasa (GGT)', weight: 1 },

  // Electrolitos y minerales
  { name: 'Sodio (Na)', weight: 2 },
  { name: 'Potasio (K)', weight: 2 },
  { name: 'Cloro (Cl)', weight: 1 },
  { name: 'Calcio total', weight: 1 },
  { name: 'Calcio iónico', weight: 1 },
  { name: 'Fósforo', weight: 1 },
  { name: 'Magnesio', weight: 1 },

  // Orina
  { name: 'Uroanálisis', weight: 3 },
  { name: 'Urocultivo', weight: 1 },
  { name: 'Microalbuminuria semiautomatizada', weight: 1 },
  { name: 'Creatinina en orina parcial', weight: 1 },
  { name: 'Urobilinógeno', weight: 1 },

  // Materia fecal
  { name: 'Sangre oculta en materia fecal', weight: 1 },
  { name: 'Coprocultivo', weight: 1 },
  { name: 'Coproscópico', weight: 1 },
  { name: 'Coprológico', weight: 2 },

  // Hormonas y vitaminas
  { name: 'Hormona estimulante de la tiroides', weight: 2 },
  { name: 'Vitamina B12', weight: 1 },
  { name: 'Vitamina D (25-hidroxivitamina D)', weight: 1 },
  { name: 'Ácido fólico', weight: 1 },

  // Hierro
  { name: 'Hierro sérico', weight: 1 },
  { name: 'Ferritina', weight: 1 },
  { name: 'Transferrina', weight: 1 },
  { name: 'Capacidad total de fijación del hierro (TIBC)', weight: 1 },

  // Infecciosas y serologia
  { name: 'VDRL / RPR', weight: 1 },
  { name: 'FTA-ABS', weight: 1 },
  { name: 'VIH 1 y 2', weight: 1 },
  { name: 'Antígeno de superficie de hepatitis B (AgHBs)', weight: 1 },
  { name: 'Anticuerpos contra hepatitis C (Anti-VHC)', weight: 1 },
  { name: 'Anticuerpos contra hepatitis A (IgM / IgG)', weight: 1 },
  { name: 'Serología para dengue (IgM, IgG, NS1)', weight: 1 },
  { name: 'Chagas (anticuerpos)', weight: 1 },
  { name: 'Toxoplasma (IgG e IgM)', weight: 1 },
  { name: 'Citomegalovirus (IgG e IgM)', weight: 1 },
  { name: 'Rubéola (IgG e IgM)', weight: 1 },

  // Especificos por sexo
  { name: 'Frotis de flujo vaginal', weight: 1, sex: 'F' },
  { name: 'Antígeno prostático específico', weight: 1, sex: 'M' },
];

/** Sedes del laboratorio que aparecen en las ordenes. */
export const LAB_SITES = ['Laureles', 'El Poblado', 'Belén', 'Envigado', 'Bello', 'Centro', 'Itagüí'];
