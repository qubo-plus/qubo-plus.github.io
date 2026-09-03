# QUBO++ User Portal — operator notes

This directory is published as `https://qubo-plus.github.io/portal/`.
Jekyll passes the files through unmodified (see `_config.yml` `defaults` entry).

## Files

- `index.html` — SPA shell, no front matter (so Jekyll does not process it)
- `app.js` — Cognito flow + state machine + fetch (vanilla JS)
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
