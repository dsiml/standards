# DSIML standards

La convention de code commune aux dépôts DSIML, et l'outillage qui la fait
respecter.

| Contenu                                                    | Rôle                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| [CONVENTIONS.md](CONVENTIONS.md)                           | Les règles : langue, git, qualité, tests, livraison, secrets           |
| [`@dsiml/eslint-config`](packages/eslint-config)           | Configuration ESLint partagée (TypeScript, React, accessibilité)       |
| [`@dsiml/prettier-config`](packages/prettier-config)       | Configuration Prettier partagée                                        |
| [node-ci.yml](.github/workflows/node-ci.yml)               | CI réutilisable : format, lint, types, tests, build                    |
| [python-ci.yml](.github/workflows/python-ci.yml)           | CI réutilisable : ruff, mypy, pytest                                   |
| [docker-publish.yml](.github/workflows/docker-publish.yml) | Image publiée sur GHCR                                                 |
| [coolify-deploy.yml](.github/workflows/coolify-deploy.yml) | Déploiement déclenché sur Coolify                                      |
| [templates/](templates)                                    | Fichiers à copier dans un dépôt : CI, ruff, commitlint, dependabot, PR |
| [rulesets/](rulesets) et [scripts/](scripts)               | Protection de `main` et des tags de version                            |

## Adopter la convention dans un projet Node

```sh
npm install --save-dev eslint@9 prettier typescript @dsiml/eslint-config @dsiml/prettier-config
```

1. Remplacer la configuration ESLint par un `eslint.config.mjs` sur le
   [modèle](templates/node/eslint.config.mjs), et la configuration Prettier
   par `"prettier": "@dsiml/prettier-config"` dans le `package.json`.
2. Ajouter les scripts `format:check`, `lint`, `typecheck`, `test` et `build`
   (voir [le contrat de CI](CONVENTIONS.md#intégration-continue)).
3. Mettre de côté les erreurs existantes : `npx eslint . --suppress-all`, puis
   versionner `eslint-suppressions.json`.
4. Copier [templates/node/ci.yml](templates/node/ci.yml) dans
   `.github/workflows/ci.yml` et l'adapter (versions de Node, base de données,
   déploiement).

## Adopter la convention dans un projet Python

```sh
uv add --dev ruff mypy pytest
```

1. Copier [templates/python/ruff.toml](templates/python/ruff.toml) à la racine
   et ajouter `[tool.mypy]` avec `strict = true` au `pyproject.toml`.
2. `uv run ruff format`, puis corriger ou mettre de côté les erreurs de
   `uv run ruff check` et `uv run mypy .`.
3. Copier [templates/python/ci.yml](templates/python/ci.yml) dans
   `.github/workflows/ci.yml`.

## Protéger `main`

Une fois la CI en place sur un dépôt :

```sh
scripts/apply-rulesets.sh <dépôt> 'ci / Result'
scripts/apply-rulesets.sh <dépôt> --reviews 0 'ci / Result'   # dépôt maintenu par une seule personne
```

Le script crée deux rulesets : `main` (PR obligatoire, squash, CI verte,
relecture) et `release tags` (seuls les administrateurs créent les tags `v*`
qui déploient en production). Les rulesets ne s'appliquent aux dépôts privés
qu'avec un plan GitHub payant (Team).

## Versions

- **Workflows** : les dépôts appellent `@v1`. Un changement compatible déplace
  le tag `v1` ; un changement incompatible crée `v2`.

  ```sh
  git tag -f v1 && git push -f origin v1
  ```

- **Paquets npm** : on monte la version dans le `package.json` du paquet, puis
  on pousse le tag correspondant. Le workflow [release](.github/workflows/release.yml)
  publie le paquet sur npm.

  ```sh
  git tag eslint-config-v1.1.0 && git push origin eslint-config-v1.1.0
  ```

  La publication passe par le _trusted publishing_ npm (OIDC) : aucun jeton npm
  n'est stocké dans GitHub. La toute première version de chaque paquet est
  publiée à la main (`npm publish` depuis le dossier du paquet, avec un compte
  membre de l'organisation npm `dsiml`), puis ce workflow est déclaré comme
  _trusted publisher_ dans les réglages du paquet sur npmjs.com.

## Développer ce dépôt

```sh
npm install
npm test          # tests de la configuration ESLint
npm run lint
npm run format:check
```
