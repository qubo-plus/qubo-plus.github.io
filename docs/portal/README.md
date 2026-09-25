# QUBO++ User Portal — operator notes

This directory is published as `https://qubo-plus.github.io/portal/`.
Jekyll passes the files through unmodified (see `_config.yml` `defaults` entry).

## Files

- `index.html` — SPA shell, no front matter (so Jekyll does not process it)
- `app.js` — Cognito flow + state machine + fetch (vanilla JS, ES module; AWS Amplify JS v6 Auth via jsDelivr ESM)
- `config.js` — public IDs, replace placeholders after deploy
- `style.css` — minimal styling

## Configure after deploying AWS resources

1. Run `secret/lambda_layer_keygen/build_layer.sh` to publish the keygen Layer.
2. Run `secret/lambda_portal/setup_cognito.sh` to create User Pool, App Client,
   and DynamoDB GSI. Capture the printed IDs.
3. Run `secret/lambda_portal/deploy.sh` with those IDs. It creates the Lambda,
   HTTP API, JWT authorizer, and CORS, then prints `API_BASE`.
4. Edit `config.js` here, replacing `REPLACE_ME_*` with the printed values.
5. Commit and push; the GitHub Pages deploy of `qubo-plus.github.io` pulls
   the updated `portal/` automatically.

## Local sanity check

Open `index.html` in a browser. With placeholders in `config.js` it shows a
"Portal not configured yet" message — confirms the SPA shell loads.

This file is excluded from Jekyll output (`docs/_config.yml` `exclude:`).

## Amplify JS v6 (since 2026-09-23)

`app.js` is an ES module that imports the Auth category of AWS Amplify JS v6
from jsDelivr's ESM bundles (`https://cdn.jsdelivr.net/npm/aws-amplify@<ver>/+esm`
plus the `auth/cognito` and `utils` sub-paths). It replaced
`amazon-cognito-identity-js`, which reports itself to Cognito as
`aws-amplify/5.0.4` and reaches end of support on 2027-03-01 (AWS notice
"Upgrade AWS Amplify JavaScript library to v6").

- **Versions are pinned to one exact `aws-amplify` release in all three import
  URLs, and every Auth function plus `cognitoUserPoolsTokenProvider` is imported
  from the single `auth/cognito` bundle.** jsDelivr bundles each entry point
  separately (internal modules are inlined per bundle): importing `signIn` from
  `auth` and the token provider from `auth/cognito` gives two token stores and
  sign-in fails with "Auth UserPool not configured" (hit during the migration).
  The `aws-amplify` root wires that same `auth/cognito` bundle as the default
  token provider, and all sub-paths of one release share one `@aws-amplify/core`.
- To upgrade: pick the new `aws-amplify` version on npm, replace the version in
  the three `import` URLs at the top of `app.js`, then run the Playwright check
  (`secret/lambda_portal/e2e/run.sh`: sign-up → verify page, sign-in →
  dashboard, memo/renew via the API, profile save, password change, sign-out,
  account delete) against a staging copy before publishing.
- Tokens are kept in `sessionStorage` via
  `cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage)` (per tab,
  cleared when the tab closes) — same policy as before.
- The sign-up code for the PreSignUp trigger travels as
  `signUp({ options: { clientMetadata: { trial_code } } })`.
