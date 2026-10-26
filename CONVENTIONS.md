# Conventions de code DSIML

Ces règles s'appliquent à tous les dépôts de l'organisation. Ce qui peut être
vérifié par un outil l'est (ESLint, Prettier, Ruff, commitlint, CI) : ce
document explique le pourquoi et couvre le reste.

## Langue

- **Le code est en anglais** : noms de variables, fonctions, types, constantes
  et fichiers, commentaires, docstrings, descriptions de tests, noms des étapes
  de CI.
- **Le français est réservé** aux textes affichés aux utilisateurs (interface)
  et aux messages d'erreur.
- La documentation destinée à l'équipe (README, ADR, ce fichier) peut être en
  français.
- Un dépôt existant passe à l'anglais au fil de l'eau : on traduit les
  commentaires des fichiers que l'on modifie, pas tout le dépôt d'un coup.

## Git

- `main` est toujours déployable. On n'y pousse jamais directement : tout
  passe par une pull request.
- Une branche par sujet, nommée `type/sujet-court` : `feat/export-csv`,
  `fix/session-expiree`.
- Messages de commit au format [Conventional Commits](https://www.conventionalcommits.org/fr/) :
  `type(scope): sujet`, vérifiés par commitlint. Types : `feat`, `fix`, `docs`,
  `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Les pull requests sont fusionnées en **squash** : le titre de la PR devient
  le commit sur `main`, il suit donc le même format.
- Une PR se fusionne quand la CI est verte, avec une relecture approuvée (sauf
  dépôt maintenu par une seule personne) et toutes les discussions résolues.

## Qualité du code

### TypeScript et JavaScript

- ESLint avec [`@dsiml/eslint-config`](packages/eslint-config) : analyse
  TypeScript avec les types, React, hooks et accessibilité (RGAA) pour le front.
- Prettier avec [`@dsiml/prettier-config`](packages/prettier-config), seul
  responsable du formatage.
- **Zéro avertissement** : la CI lance `eslint . --max-warnings=0`.
- `any` est interdit hors des tests. Une promesse est toujours attendue
  (`await`) ou explicitement ignorée (`void`).
- Le preset `codeShape` (pas de boucles, pas de `let`, complexité ≤ 10,
  fonctions ≤ 80 lignes) est recommandé pour les nouveaux projets.

### Python

- [Ruff](templates/python/ruff.toml) pour le lint et le formatage, mypy en mode
  strict pour les types, pytest pour les tests. Les trois sont dans le groupe
  `dev` du `pyproject.toml`, gérés par uv.

### Code existant

On n'impose pas les règles d'un coup à un dépôt existant. Les erreurs actuelles
sont mises de côté, et seul le code nouveau ou modifié doit être propre :

- ESLint : `npx eslint . --suppress-all` crée `eslint-suppressions.json`. Le
  fichier est versionné et ne doit que diminuer : `npx eslint . --prune-suppressions`
  retire les entrées corrigées.
- Ruff : `uv run ruff check --add-noqa` ajoute un `# noqa` sur chaque ligne en
  erreur.

## Tests

- Chaque correction de bug arrive avec le test qui l'aurait détectée.
- Les tests tournent sans service externe réel : la CI ne fournit qu'une base
  Postgres jetable.
- La couverture est publiée par la CI ; un seuil est fixé par projet dans la
  configuration du lanceur de tests (Vitest, c8, pytest-cov).

## Intégration continue

Chaque dépôt a un `.github/workflows/ci.yml` qui appelle les workflows
réutilisables de ce dépôt ([modèle Node](templates/node/ci.yml),
[modèle Python](templates/python/ci.yml)). Pour un projet Node, le contrat est
celui des scripts du `package.json`, lancés s'ils existent :

| Script                 | Rôle                                 |
| ---------------------- | ------------------------------------ |
| `format:check`         | `prettier --check .`                 |
| `lint`                 | `eslint . --max-warnings=0`          |
| `typecheck`            | `tsc --noEmit` (ou équivalent)       |
| `test:coverage`/`test` | tests, avec couverture si disponible |
| `build`                | construction de production           |

Un projet qui a besoin d'une étape préalable (génération du client Prisma, par
exemple) la déclare dans un script `pre` (`prelint`, `pretest`), pas dans la CI.

## Livraison

```
PR ──▶ CI + relecture ──▶ squash sur main ──▶ image :main ──▶ recette
                                    tag vX.Y.Z ──▶ image :X.Y.Z ──▶ production
```

- Les images sont publiées sur GHCR, taguées `sha-<commit>`, `main` et, sur un
  tag de version, `X.Y.Z` et `latest`.
- La recette se déploie à chaque fusion sur `main`. La production se déploie
  sur un tag `vX.Y.Z`, que seuls les administrateurs du dépôt peuvent créer.
- Les secrets de déploiement sont des secrets d'**environnement** GitHub
  (`staging`, `production`), jamais des secrets de dépôt ni des valeurs en dur.

## Secrets et données personnelles

- Aucun secret dans le dépôt : `.env` est ignoré par git, `.env.example`
  documente les variables avec des valeurs factices.
- Aucune donnée personnelle réelle dans les tests, les fixtures ou les logs.
- Les outils d'observabilité (logs, erreurs) reçoivent des identifiants
  techniques, jamais de nom, courriel ou numéro de téléphone.

## Observabilité

- Les erreurs des applications sont envoyées à GlitchTip avec le SDK Sentry.
  Le DSN est lu dans la variable d'environnement `SENTRY_DSN` : vide en local,
  le SDK ne fait rien.
- La release envoyée est le SHA du commit, pour relier chaque erreur à la
  version qui l'a produite.
- Les données personnelles sont filtrées avant l'envoi (`beforeSend`).
