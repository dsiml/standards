# @dsiml/prettier-config

Shared Prettier config for DSIML projects: tabs, no semicolons, single quotes,
trailing commas.

```sh
npm install --save-dev prettier @dsiml/prettier-config
```

```json
// package.json
{ "prettier": "@dsiml/prettier-config" }
```

With plugins, extend it from a `prettier.config.mjs`:

```js
import dsiml from '@dsiml/prettier-config'

export default { ...dsiml, plugins: ['prettier-plugin-tailwindcss'] }
```
