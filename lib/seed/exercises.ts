import type { ExerciseCategory, MuscleGroup } from "../db/types";

export interface SeedExercise {
  /** Stable slug used as id for the global catalog. */
  slug: string;
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
}

const INCREMENT_BY_CATEGORY: Record<ExerciseCategory, number> = {
  compound_heavy: 2.5,
  compound_light: 2.5,
  isolation: 1.0,
};

export function defaultIncrementFor(category: ExerciseCategory): number {
  return INCREMENT_BY_CATEGORY[category];
}

export const SEED_EXERCISES: SeedExercise[] = [
  // ---- Legs (compound heavy) ----
  { slug: "back-squat", name: "Sentadilla con barra", muscle_group: "legs", category: "compound_heavy" },
  { slug: "front-squat", name: "Sentadilla frontal", muscle_group: "legs", category: "compound_heavy" },
  { slug: "deadlift", name: "Peso muerto convencional", muscle_group: "legs", category: "compound_heavy" },
  { slug: "sumo-deadlift", name: "Peso muerto sumo", muscle_group: "legs", category: "compound_heavy" },
  { slug: "romanian-deadlift", name: "Peso muerto rumano", muscle_group: "legs", category: "compound_heavy" },
  { slug: "hip-thrust", name: "Hip thrust con barra", muscle_group: "legs", category: "compound_heavy" },
  { slug: "bulgarian-split-squat", name: "Sentadilla búlgara", muscle_group: "legs", category: "compound_heavy" },
  { slug: "leg-press", name: "Prensa de piernas", muscle_group: "legs", category: "compound_heavy" },
  { slug: "hack-squat", name: "Hack squat", muscle_group: "legs", category: "compound_heavy" },
  { slug: "walking-lunges", name: "Zancadas caminando", muscle_group: "legs", category: "compound_light" },

  // ---- Legs (isolation) ----
  { slug: "leg-extension", name: "Extensión de cuádriceps", muscle_group: "legs", category: "isolation" },
  { slug: "leg-curl-seated", name: "Curl femoral sentado", muscle_group: "legs", category: "isolation" },
  { slug: "leg-curl-lying", name: "Curl femoral acostado", muscle_group: "legs", category: "isolation" },
  { slug: "calf-raise-standing", name: "Elevación de gemelos de pie", muscle_group: "legs", category: "isolation" },
  { slug: "calf-raise-seated", name: "Elevación de gemelos sentado", muscle_group: "legs", category: "isolation" },
  { slug: "hip-adduction", name: "Aductores en máquina", muscle_group: "legs", category: "isolation" },
  { slug: "hip-abduction", name: "Abductores en máquina", muscle_group: "legs", category: "isolation" },

  // ---- Chest (compound) ----
  { slug: "bench-press-flat", name: "Press banca plano", muscle_group: "chest", category: "compound_light" },
  { slug: "bench-press-incline", name: "Press banca inclinado", muscle_group: "chest", category: "compound_light" },
  { slug: "bench-press-decline", name: "Press banca declinado", muscle_group: "chest", category: "compound_light" },
  { slug: "dumbbell-press-flat", name: "Press con mancuernas plano", muscle_group: "chest", category: "compound_light" },
  { slug: "dumbbell-press-incline", name: "Press con mancuernas inclinado", muscle_group: "chest", category: "compound_light" },
  { slug: "machine-chest-press", name: "Press de pecho en máquina", muscle_group: "chest", category: "compound_light" },
  { slug: "dips-chest", name: "Fondos en paralelas (pecho)", muscle_group: "chest", category: "compound_light" },

  // ---- Chest (isolation) ----
  { slug: "cable-fly", name: "Aperturas en poleas", muscle_group: "chest", category: "isolation" },
  { slug: "pec-deck", name: "Peck deck", muscle_group: "chest", category: "isolation" },
  { slug: "dumbbell-fly", name: "Aperturas con mancuernas", muscle_group: "chest", category: "isolation" },

  // ---- Back (compound) ----
  { slug: "pull-up", name: "Dominadas", muscle_group: "back", category: "compound_light" },
  { slug: "chin-up", name: "Dominadas supinas", muscle_group: "back", category: "compound_light" },
  { slug: "lat-pulldown", name: "Jalón al pecho", muscle_group: "back", category: "compound_light" },
  { slug: "barbell-row", name: "Remo con barra", muscle_group: "back", category: "compound_light" },
  { slug: "pendlay-row", name: "Pendlay row", muscle_group: "back", category: "compound_light" },
  { slug: "dumbbell-row", name: "Remo con mancuerna", muscle_group: "back", category: "compound_light" },
  { slug: "t-bar-row", name: "Remo en T", muscle_group: "back", category: "compound_light" },
  { slug: "seated-cable-row", name: "Remo sentado en polea", muscle_group: "back", category: "compound_light" },
  { slug: "chest-supported-row", name: "Remo apoyado en banco", muscle_group: "back", category: "compound_light" },

  // ---- Back (isolation) ----
  { slug: "straight-arm-pulldown", name: "Pull-over en polea", muscle_group: "back", category: "isolation" },
  { slug: "face-pull", name: "Face pull", muscle_group: "back", category: "isolation" },
  { slug: "reverse-fly", name: "Aperturas inversas", muscle_group: "back", category: "isolation" },

  // ---- Shoulders ----
  { slug: "overhead-press", name: "Press militar con barra", muscle_group: "shoulders", category: "compound_light" },
  { slug: "dumbbell-shoulder-press", name: "Press de hombros con mancuernas", muscle_group: "shoulders", category: "compound_light" },
  { slug: "machine-shoulder-press", name: "Press de hombros en máquina", muscle_group: "shoulders", category: "compound_light" },
  { slug: "arnold-press", name: "Press Arnold", muscle_group: "shoulders", category: "compound_light" },
  { slug: "lateral-raise", name: "Elevaciones laterales", muscle_group: "shoulders", category: "isolation" },
  { slug: "front-raise", name: "Elevaciones frontales", muscle_group: "shoulders", category: "isolation" },
  { slug: "cable-lateral-raise", name: "Elevaciones laterales en polea", muscle_group: "shoulders", category: "isolation" },
  { slug: "rear-delt-fly", name: "Pájaros (deltoide posterior)", muscle_group: "shoulders", category: "isolation" },
  { slug: "upright-row", name: "Remo al mentón", muscle_group: "shoulders", category: "compound_light" },

  // ---- Arms (biceps) ----
  { slug: "barbell-curl", name: "Curl con barra", muscle_group: "arms", category: "isolation" },
  { slug: "ez-curl", name: "Curl con barra Z", muscle_group: "arms", category: "isolation" },
  { slug: "dumbbell-curl", name: "Curl con mancuernas", muscle_group: "arms", category: "isolation" },
  { slug: "hammer-curl", name: "Curl martillo", muscle_group: "arms", category: "isolation" },
  { slug: "incline-dumbbell-curl", name: "Curl inclinado con mancuernas", muscle_group: "arms", category: "isolation" },
  { slug: "preacher-curl", name: "Curl en banco Scott", muscle_group: "arms", category: "isolation" },
  { slug: "cable-curl", name: "Curl en polea", muscle_group: "arms", category: "isolation" },
  { slug: "concentration-curl", name: "Curl concentrado", muscle_group: "arms", category: "isolation" },

  // ---- Arms (triceps) ----
  { slug: "close-grip-bench", name: "Press banca agarre cerrado", muscle_group: "arms", category: "compound_light" },
  { slug: "dips-triceps", name: "Fondos para tríceps", muscle_group: "arms", category: "compound_light" },
  { slug: "skull-crusher", name: "Press francés", muscle_group: "arms", category: "isolation" },
  { slug: "triceps-pushdown", name: "Extensión de tríceps en polea", muscle_group: "arms", category: "isolation" },
  { slug: "overhead-triceps-extension", name: "Extensión de tríceps por encima de la cabeza", muscle_group: "arms", category: "isolation" },
  { slug: "rope-pushdown", name: "Extensión de tríceps con soga", muscle_group: "arms", category: "isolation" },
  { slug: "diamond-pushup", name: "Flexiones diamante", muscle_group: "arms", category: "compound_light" },

  // ---- Forearms ----
  { slug: "wrist-curl", name: "Curl de muñecas", muscle_group: "arms", category: "isolation" },
  { slug: "reverse-wrist-curl", name: "Curl inverso de muñecas", muscle_group: "arms", category: "isolation" },

  // ---- Core ----
  { slug: "plank", name: "Plancha", muscle_group: "core", category: "isolation" },
  { slug: "hanging-leg-raise", name: "Elevación de piernas colgado", muscle_group: "core", category: "isolation" },
  { slug: "cable-crunch", name: "Crunch en polea", muscle_group: "core", category: "isolation" },
  { slug: "ab-wheel", name: "Rueda abdominal", muscle_group: "core", category: "isolation" },
  { slug: "russian-twist", name: "Russian twist", muscle_group: "core", category: "isolation" },
  { slug: "decline-situp", name: "Abdominales en banco declinado", muscle_group: "core", category: "isolation" },
];
