# Diccionario de datos

## Sesiones

| Variable | Descripción |
|---|---|
| `session_id` | Identificador único de sesión. |
| `participant_id` | Código anónimo ingresado o generado. |
| `random_seed` | Semilla que reproduce el plan. |
| `status` | `setup`, `active` o `complete`. |
| `salience_high` | Promedio de cinco valoraciones para Persona A. |
| `salience_neutral` | Promedio de cinco valoraciones para Persona B. |
| `alias_*_length` | Longitud del alias, sin guardar su contenido. |
| `started_at`, `completed_at` | Marcas temporales ISO 8601. |

## Ensayos

| Variable | Descripción |
|---|---|
| `trial_id` | Identificador reproducible del ensayo. |
| `stage` | `practice`, `baseline` o `main`. |
| `block` | Bloque experimental. |
| `stimulus` | Letra presentada. |
| `target` | 1 = responder; 0 = inhibir respuesta ante X. |
| `response` | `space` o vacío. |
| `correct` | Exactitud binaria. |
| `omission` | Falta de respuesta en ensayo go. |
| `false_alarm` | Respuesta ante X. |
| `rt_ms` | Tiempo de reacción desde aparición de la letra. |
| `rt_valid` | RT dentro del intervalo técnico previsto. |
| `validation_flag` | `anticipatory`, `focus_compromised` o vacío. |
| `distractor_event_id` | Episodio distractor asociado. |
| `distractor_category` | `high`, `neutral`, `unknown` o `none`. |
| `salience_score` | Saliencia asignada a la condición. |
| `post_distractor_lag` | 1–5; 0 fuera de ventana de recuperación. |
| `probe_after` | Indica si después del ensayo aparece una sonda. |
| `window_focus` | `focused` o `compromised`. |

## Evaluaciones

- `relevance_pre`: valoraciones 0–10 y puntuaciones de saliencia.
- `thought_probe`: respuesta, condición y tiempo de respuesta.
- `manipulation_check`: urgencia, deseo de responder y pensamiento por condición.

## Eventos

- `distractor_onset`: inicio de una notificación.
- `focus_lost`: pérdida de foco de la ventana.
- `visibility_change`: cambio de pestaña o visibilidad.
- `experiment_started` y `experiment_completed`.
