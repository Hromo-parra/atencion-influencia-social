window.DEMO_CONFIG = {
  team: 'Equipo 1 · Distractores sociales', title: 'Atención bajo influencia social', duration: '2 minutos',
  intro: 'Recorre una muestra de la tarea CPT y observa cómo se presenta un distractor interpersonal. No es una sesión experimental.',
  outro: 'El protocolo completo compara la atención antes y después de distractores de distinta saliencia. La demo solo enseña el procedimiento.',
  steps: [
    {type:'info', title:'Preparación del estudio', text:'En una sesión real se registran un código anónimo y dos alias, se valora su relevancia y se explica la regla de respuesta.', points:['Responde ante cualquier letra excepto X.','Los alias reales no aparecen en los archivos exportados.','La sesión completa contiene práctica, línea basal y bloques con distractores.']},
    {type:'cpt', title:'Una notificación y seis ensayos', text:'Prueba la regla go/no-go en un bloque deliberadamente corto.', notification:'Una persona importante para ti te envió un mensaje'},
    {type:'choice', title:'Sonda de pensamiento', text:'Después de algunos distractores se pregunta dónde estaba la atención.', question:'¿En qué estabas pensando justo antes de esta pregunta?', options:['En la tarea de letras','En la notificación','En otra cosa'], feedback:'En el estudio esta respuesta se relaciona con el tipo de distractor y el rendimiento posterior.'},
    {type:'info', title:'Qué se revisa al final', text:'El panel investigador permite exportar ensayos, resúmenes y respaldo JSON.', points:['Tiempo de reacción y precisión.','Recuperación en los cinco ensayos posteriores al distractor.','Respuestas a las sondas y control de calidad.']}
  ]
};
