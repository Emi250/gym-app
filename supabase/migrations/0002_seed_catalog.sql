-- 0002_seed_catalog.sql — Global exercise catalog (user_id = NULL)
-- Idempotent: skip rows already present by name.

insert into exercises (user_id, name, muscle_group, category, default_increment_kg) values
  -- Legs (compound heavy)
  (null, 'Sentadilla con barra', 'legs', 'compound_heavy', 2.5),
  (null, 'Sentadilla frontal', 'legs', 'compound_heavy', 2.5),
  (null, 'Peso muerto convencional', 'legs', 'compound_heavy', 2.5),
  (null, 'Peso muerto sumo', 'legs', 'compound_heavy', 2.5),
  (null, 'Peso muerto rumano', 'legs', 'compound_heavy', 2.5),
  (null, 'Hip thrust con barra', 'legs', 'compound_heavy', 2.5),
  (null, 'Sentadilla búlgara', 'legs', 'compound_heavy', 2.5),
  (null, 'Prensa de piernas', 'legs', 'compound_heavy', 2.5),
  (null, 'Hack squat', 'legs', 'compound_heavy', 2.5),
  (null, 'Zancadas caminando', 'legs', 'compound_light', 2.5),
  -- Legs (isolation)
  (null, 'Extensión de cuádriceps', 'legs', 'isolation', 1.0),
  (null, 'Curl femoral sentado', 'legs', 'isolation', 1.0),
  (null, 'Curl femoral acostado', 'legs', 'isolation', 1.0),
  (null, 'Elevación de gemelos de pie', 'legs', 'isolation', 1.0),
  (null, 'Elevación de gemelos sentado', 'legs', 'isolation', 1.0),
  (null, 'Aductores en máquina', 'legs', 'isolation', 1.0),
  (null, 'Abductores en máquina', 'legs', 'isolation', 1.0),
  -- Chest (compound)
  (null, 'Press banca plano', 'chest', 'compound_light', 2.5),
  (null, 'Press banca inclinado', 'chest', 'compound_light', 2.5),
  (null, 'Press banca declinado', 'chest', 'compound_light', 2.5),
  (null, 'Press con mancuernas plano', 'chest', 'compound_light', 2.5),
  (null, 'Press con mancuernas inclinado', 'chest', 'compound_light', 2.5),
  (null, 'Press de pecho en máquina', 'chest', 'compound_light', 2.5),
  (null, 'Fondos en paralelas (pecho)', 'chest', 'compound_light', 2.5),
  -- Chest (isolation)
  (null, 'Aperturas en poleas', 'chest', 'isolation', 1.0),
  (null, 'Peck deck', 'chest', 'isolation', 1.0),
  (null, 'Aperturas con mancuernas', 'chest', 'isolation', 1.0),
  -- Back (compound)
  (null, 'Dominadas', 'back', 'compound_light', 2.5),
  (null, 'Dominadas supinas', 'back', 'compound_light', 2.5),
  (null, 'Jalón al pecho', 'back', 'compound_light', 2.5),
  (null, 'Remo con barra', 'back', 'compound_light', 2.5),
  (null, 'Pendlay row', 'back', 'compound_light', 2.5),
  (null, 'Remo con mancuerna', 'back', 'compound_light', 2.5),
  (null, 'Remo en T', 'back', 'compound_light', 2.5),
  (null, 'Remo sentado en polea', 'back', 'compound_light', 2.5),
  (null, 'Remo apoyado en banco', 'back', 'compound_light', 2.5),
  -- Back (isolation)
  (null, 'Pull-over en polea', 'back', 'isolation', 1.0),
  (null, 'Face pull', 'back', 'isolation', 1.0),
  (null, 'Aperturas inversas', 'back', 'isolation', 1.0),
  -- Shoulders
  (null, 'Press militar con barra', 'shoulders', 'compound_light', 2.5),
  (null, 'Press de hombros con mancuernas', 'shoulders', 'compound_light', 2.5),
  (null, 'Press de hombros en máquina', 'shoulders', 'compound_light', 2.5),
  (null, 'Press Arnold', 'shoulders', 'compound_light', 2.5),
  (null, 'Elevaciones laterales', 'shoulders', 'isolation', 1.0),
  (null, 'Elevaciones frontales', 'shoulders', 'isolation', 1.0),
  (null, 'Elevaciones laterales en polea', 'shoulders', 'isolation', 1.0),
  (null, 'Pájaros (deltoide posterior)', 'shoulders', 'isolation', 1.0),
  (null, 'Remo al mentón', 'shoulders', 'compound_light', 2.5),
  -- Arms biceps
  (null, 'Curl con barra', 'arms', 'isolation', 1.0),
  (null, 'Curl con barra Z', 'arms', 'isolation', 1.0),
  (null, 'Curl con mancuernas', 'arms', 'isolation', 1.0),
  (null, 'Curl martillo', 'arms', 'isolation', 1.0),
  (null, 'Curl inclinado con mancuernas', 'arms', 'isolation', 1.0),
  (null, 'Curl en banco Scott', 'arms', 'isolation', 1.0),
  (null, 'Curl en polea', 'arms', 'isolation', 1.0),
  (null, 'Curl concentrado', 'arms', 'isolation', 1.0),
  -- Arms triceps
  (null, 'Press banca agarre cerrado', 'arms', 'compound_light', 2.5),
  (null, 'Fondos para tríceps', 'arms', 'compound_light', 2.5),
  (null, 'Press francés', 'arms', 'isolation', 1.0),
  (null, 'Extensión de tríceps en polea', 'arms', 'isolation', 1.0),
  (null, 'Extensión de tríceps por encima de la cabeza', 'arms', 'isolation', 1.0),
  (null, 'Extensión de tríceps con soga', 'arms', 'isolation', 1.0),
  (null, 'Flexiones diamante', 'arms', 'compound_light', 2.5),
  -- Forearms
  (null, 'Curl de muñecas', 'arms', 'isolation', 1.0),
  (null, 'Curl inverso de muñecas', 'arms', 'isolation', 1.0),
  -- Core
  (null, 'Plancha', 'core', 'isolation', 1.0),
  (null, 'Elevación de piernas colgado', 'core', 'isolation', 1.0),
  (null, 'Crunch en polea', 'core', 'isolation', 1.0),
  (null, 'Rueda abdominal', 'core', 'isolation', 1.0),
  (null, 'Russian twist', 'core', 'isolation', 1.0),
  (null, 'Abdominales en banco declinado', 'core', 'isolation', 1.0)
on conflict do nothing;
