# Atención bajo influencia social

Aplicación web piloto para el Equipo 1 del proyecto **Distractores sociales y control atencional**. Implementa una CPT tipo go/no-go con distractores interpersonales, recuperación durante cinco ensayos y sondas breves de pensamiento.

Aplicación publicada: <https://hromo-parra.github.io/atencion-influencia-social/>

## Estado

Esta es una versión para **pilotaje técnico**, no una aplicación validada ni un instrumento diagnóstico. Antes de una recolección formal deben aprobarse el consentimiento, los criterios de exclusión, el análisis estadístico y la versión definitiva del protocolo.

## Diseño implementado

- Participantes adultos.
- Tres condiciones: alta saliencia, conocida neutra y desconocida.
- Responder con espacio ante todas las letras excepto `X`.
- 24 ensayos de práctica.
- 48 ensayos basales.
- Tres bloques de 84 ensayos.
- 24 distractores, ocho por condición.
- Cinco ensayos go posteriores a cada distractor.
- Sondas de pensamiento en aproximadamente la mitad de los episodios.
- Comprobación de manipulación al finalizar.

La respuesta frecuente permite estimar tiempo de reacción en cada posición de recuperación. Los cinco ensayos posteriores al distractor se fuerzan como go; esta decisión debe conservarse en el análisis y revisarse durante el piloto.

## Privacidad

Los alias de las personas se mantienen únicamente en memoria durante la sesión. No se guardan en IndexedDB ni aparecen en las exportaciones. Sólo se almacenan condición, longitud del alias y puntuaciones de saliencia.

Los resultados permanecen en el navegador del dispositivo. GitHub Pages no es una base de datos ni un sistema de almacenamiento institucional.

## Uso

1. Servir la carpeta mediante un servidor web local o GitHub Pages.
2. Abrir `index.html` desde la URL del servidor.
3. Ejecutar la sesión con teclado físico.
4. Descargar JSON de la sesión al terminar o entrar a **Modo investigador**.
5. Exportar CSV de ensayos, CSV de resumen y respaldo JSON.

## Verificación

```bash
npm test
npm run check
```

No hay dependencias externas ni proceso de compilación. El repositorio completo puede publicarse directamente con GitHub Pages.

## Archivos principales

- `app.js`: navegación y ejecución del experimento.
- `src/config.js`: parámetros del piloto.
- `src/trials.js`: generación reproducible y validación del plan.
- `src/storage.js`: almacenamiento por ensayo en IndexedDB.
- `src/export.js`: CSV, JSON y resumen descriptivo.
- `PROTOCOL.md`: decisiones metodológicas implementadas.
- `DATA_DICTIONARY.md`: diccionario de variables.
- `MANUAL-DE-APLICACION.md`: guía para docente/investigador.

## Demo para presentación

Abre [demo.html](demo.html) o el botón «Demo para presentación» en la app. El recorrido interactivo muestra una versión abreviada del procedimiento con ejemplos ficticios. No solicita consentimiento, no guarda respuestas y no exporta datos de investigación. La demo no reemplaza el protocolo completo ni la sesión de participante.
