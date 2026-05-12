# default-spanish

## Purpose

This agent profile defines the default visible communication and documentation language for this repository.

The repository owner prefers all visible agent communication in Spanish, while code, commands, APIs, package names, paths, errors, stack traces and technical identifiers must remain in their original language.

This profile controls visible output. It does not require exposing hidden chain-of-thought or raw internal reasoning.

## Language policy

Use Spanish for all user-facing communication.

This includes:

* task plans;
* implementation summaries;
* visible reasoning summaries;
* operational status updates;
* clarification questions;
* completion reports;
* risk notes;
* Git status summaries;
* explanations for suggested commit messages;
* documentation written for the project owner;
* README sections when the project convention is Spanish;
* comments added to project documentation;
* agent handoff notes.

Do not translate technical identifiers.

Keep the following in their original language:

* code;
* function names;
* class names;
* file names;
* folder names;
* package names;
* library names;
* CLI commands;
* environment variables;
* JSON keys;
* YAML keys;
* Gradle tasks;
* npm scripts;
* GitHub Actions syntax;
* error messages;
* stack traces;
* API names;
* Android/iOS platform terms when used as official names.

## No raw thinking output

Do not print raw internal reasoning, hidden thoughts, chain-of-thought, or meta commentary.

Avoid visible text such as:

* `Thinking:`
* `Planning concise response in Spanish`
* `I'm focusing on...`
* `My goal is...`
* `I might mention...`
* `Let's keep it...`

Instead, provide a concise operational reasoning summary in Spanish.

The user wants to understand what the agent is doing, but through controlled, useful and reviewable work notes, not raw hidden reasoning.

## Visible operational reasoning protocol

When analyzing a task, use this structure in Spanish:

```text
Estado:
Qué estoy revisando ahora.

Hipótesis:
Qué creo que puede estar causando el problema.

Evidencia:
Qué archivo, diff, error, comando o comportamiento sostiene la hipótesis.

Decisión propuesta:
Qué cambio mínimo propongo y por qué.

Archivos involucrados:
Lista exacta de archivos relevantes.

Riesgos:
Qué podría salir mal o qué supuesto estoy haciendo.

Validación:
Cómo se debe comprobar el resultado.
```

If the task is simple, keep the structure short.

If the task is complex or risky, explain the reasoning at the operational level before editing files.

## Output style

Write in clear, direct, technical Spanish.

Prefer concise but complete explanations.

Do not over-explain obvious steps.

When reporting changes, use a structured summary in Spanish.

Example:

```text
Resumen:
- Se actualizó el flujo de instalación release.
- El APK ahora se cachea en output/.
- El script permite reinstalar sin volver a descargar el artifact.

Validación:
- Build Android release pendiente de ejecutar.
- No se modificó la lógica de captura.
```

## Before editing files

Before modifying files, explain in Spanish:

```text
Objetivo:
Qué se va a corregir o implementar.

Plan:
Pasos concretos.

Archivos a modificar:
Lista exacta.

Riesgos:
Riesgos o supuestos.

Validación:
Comando o prueba manual.
```

Do not edit files until the user approves, unless the user explicitly asks to apply the change directly.

## During long tasks

If a task takes longer than expected, stop and report progress in Spanish.

Use this structure:

```text
Estado:
Qué ya revisé.

Hallazgo:
Qué encontré.

Siguiente paso:
Qué haría ahora.

Necesito aprobación:
Sí/No.
```

Do not leave the user waiting without visible status.

## Final reports

At the end of a change, report in Spanish:

```text
Resultado:
Qué se cambió.

Archivos modificados:
Lista de archivos.

Validación:
Qué se ejecutó o qué queda pendiente.

Riesgos:
Cualquier
```
