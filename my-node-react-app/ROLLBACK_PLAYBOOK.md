# DMI Church Production Rollback Playbook

If a critical failure occurs during deployment on Production infrastructure, refer immediately to the workflows below.

## 1. Rollback API/Backend (Docker)
Since DMI utilizes explicit `docker-compose` versioning mappings:
1. SSH into the orchestrating node.
2. Locate the `.env` or explicit `docker-compose.yml` tags pointing to the broken `dmi-api:latest`.
3. Overwrite `latest` to the previous stable semantic tag (e.g. `dmi-api:1.0.4`).
4. Execute strictly `docker-compose up -d api` to safely restart just the API node under the older image natively without touching DB arrays.

## 2. Revert Database Schema (Postgres)
If the regression was caused by a fatal `node-pg-migrate` execution (e.g. data loss via column drops):
1. Immediately run: `npm run migrate down` from the backend root terminal to explicitly pop off the topmost bad migration layer. 
2. If down-migration fails spectacularly or destroys underlying mappings, execute `docker exec -t pg-dmi pg_restore` sourcing directly from the cron-generated `.sql.gz` backups located on the persistent attached volumes.

## 3. Rollback Frontend (React / Nginx)
If the Frontend bundled logic breaks the UX (blank white screens context errors):
1. Immediately checkout the previous stable `git` tag tracking the main branch.
2. Run `npm run build` strictly on the `client` folder.
3. Rsync/over-write the `build/` artifact blob targeting NGINX static directories mapped to `80`. Ensure edge cache headers reset. Note: If using Cloudflare, explicitly demand a `Purge Cache` against `/index.html` to break aggressive 24h caching.
