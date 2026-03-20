# Architectural Documentation: Modulith over Microservices

This document outlines the architectural scaling logic employed in the DMI application as it progresses from Phase 1 through Phase 12.

## 1. Monolithic Core vs Microservices
Given the constraints and usage logic of this church API (content delivery, event listings, donations, basic administration), a full Microservices transition (managing distinct repos, complex orchestration, network boundaries) introduces unjustified operational overhead without yielding equivalent ROI. 

Instead, we adopted a **"Modulith" architecture**:
- **Separation of Concerns:** Core components (Events, Blog, Donations, Authentication, Media) are explicitly separated into MVC controllers and specific routing namespaces.
- **Background Delegation:** Heavy external integrations (like Mailchimp synchronization or potentially long running batch jobs later) are excised from the request-response cycle and pushed to an external Redis-backed worker Queue using BullMQ.
  
This provides **Microservice-like scalability** (we can spin up 100 `worker` Dynos/Containers specifically for BullMQ without touching the `api` web containers) without the catastrophic mental overhead of tracking distributed traces through 14 different deployed git repositories.

## 2. Stateless Application Design
The Express API instances are intentionally stateless.
- **Auth:** Relying solely on stateless JWTs rather than server-side session stores for authentication.
- **Uploads:** To scale horizontally behind a load balancer, standard local disk uploads should eventually be abstracted to S3.
- **Cache**: Using Redis for high-frequency queries (`/api/events`) allows independent API instances to share cache natively without memory fragmentation.

## 3. Database Scaling
- PostgreSQL serves as the persistent truth. Should read-pressure outscale vertical provisioning, Redis caching protects 95% of the read load. If database writes (very rare outside of donations and admin dashboarding) become a bottleneck, PostgreSQL read-replicas could be introduced utilizing specialized replication mechanisms logic abstracted behind the `config/db.js` initialization.

## 4. Edge Caching & CDNs (Phase 4)
Instead of a complex, disjointed S3 + CloudFront setup right away, the backend serves `/uploads` natively but injects strict 1-year `Cache-Control` (`max-age=31536000, immutable`) headers. This allows any standard Edge Proxy (like Cloudflare, which sits at the DNS level) to instantly auto-cache these assets globally at Edge nodes without requiring any code changes to the API endpoints.

## 5. Migrations & Backups (Phases 6/7/9)
- **Migrations:** All database manipulations are strictly enforced via `node-pg-migrate`. No direct database alterations are permitted on production. Each schema change belongs in a timestamped migration script living inside the `/migrations` folder ensuring local and production schemas never skew.
- **Backups:** Full database dumps (e.g. `pg_dump`) must be automated natively via `cron` utilizing the server runtime environment matching the exact Docker container instance. These `.sql.gz` dump files must be vaulted natively to an isolated encrypted tier (e.g. Private S3 or Google Cloud storage bucket) immediately post-dump.


