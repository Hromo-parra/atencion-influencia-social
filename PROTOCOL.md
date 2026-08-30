# Protocolo implementado — v0.1 piloto

## Pregunta

¿La presentación de una señal asociada con una persona de alta saliencia produce mayor captura inmediata y recuperación más lenta que una señal asociada con una persona conocida neutra o desconocida?

## Alcance

El piloto trabaja sólo con adultos y mantiene constante la carga atencional. No incorpora adolescentes, memoria incidental, elección de abrir mensajes, eye-tracking, EEG ni manipulación alta/baja de carga.

## Tarea primaria

CPT tipo go/no-go:

- responder con espacio ante todas las letras salvo `X`;
- ventana de respuesta: 800 ms;
- fijación: 250 ms;
- intervalo posterior: 250 ms;
- proporción no-go fuera de ventanas post-distractor: aproximadamente 12%;
- respuestas inferiores a 120 ms se marcan como anticipatorias.

Se eligió una tasa alta de respuestas para obtener RT en cada uno de los cinco ensayos posteriores al distractor. Todos esos ensayos son go por construcción.

## Distractores

- 24 episodios: ocho por condición.
- Duración: 700 ms.
- Orden pseudoaleatorio, balanceado y reproducible.
- No se permiten categorías idénticas consecutivas.
- Alta saliencia y conocida neutra usan alias proporcionados por el participante.
- La condición desconocida usa “Alex”.
- Los alias no se guardan.

## Resultados

Primario:

`captura = mediana(RT_lag1 − mediana de los cinco ensayos go válidos previos al distractor)`

El resumen conserva además la mediana del bloque basal como indicador descriptivo global. Si una ventana local no contiene observaciones suficientes, ese episodio no contribuye al coste correspondiente.

Secundarios:

- costes de RT en lag 2–5;
- omisiones y falsas alarmas;
- probabilidad de pensar en la persona presentada;
- diferencias por saliencia continua;
- pérdida de foco y latencias anticipatorias.

El CSV de resumen es descriptivo. La estimación de una constante exponencial de recuperación debe realizarse posteriormente con un script estadístico y suficiente información por participante/condición.

## Decisiones pendientes antes del estudio confirmatorio

1. Análisis de potencia y tamaño de muestra.
2. Criterios definitivos de exclusión por precisión, pérdida de foco y RT.
3. Validación cognitiva de instrucciones y escalas.
4. Revisión del número de episodios y duración tras el piloto.
5. Consentimiento y aprobación ética.
6. Plan institucional de transferencia, respaldo y retención de datos.
7. Modelo mixto y contrastes preregistrados.
