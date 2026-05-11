# /finalize-plan

Use this command at the end of a completed implementation plan.

## Intent

Invoke the `version-governor` agent behavior to:

1. review Git working tree;
2. summarize completed changes;
3. detect possible secrets/artifacts;
4. propose Conventional Commit message(s);
5. ask whether to create a commit.

## Manual invocation flow

If your OpenCode setup does not support automatic hooks, run this command manually as the final step of a task.

Expected operator behavior:

- perform read-only Git inspection first (`git status --short`, diffs, stats);
- produce a concise final summary;
- ask: `Quieres que cree un commit con estos cambios?`;
- only after explicit approval: stage relevant files and commit;
- do not push unless explicitly requested.

## Guardrails

- No automatic `git add`, `git commit`, or `git push` without confirmation.
- Warn before including `.env`, credentials, secrets, keystores, or heavy artifacts.
