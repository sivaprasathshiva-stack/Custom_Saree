# 12 — Storage Architecture

## Decision: Supabase Storage

Same project as the database and auth already in use — zero new vendor, consistent IAM (storage policies can reference `auth.uid()` the same way RLS does). No justification exists to introduce S3/R2 for a project already standardized on Supabase.

## Buckets

```
artwork/          user-uploaded motifs — private, owner-scoped read via signed URL
design-previews/  flat canvas exports, drape previews — private, owner-scoped
model-assets/     model photos/illustrations + region masks — public-read (not user data)
```

## Key naming (§63, adopted verbatim)

```
design/{designId}/artwork/{assetId}.png
design/{designId}/versions/{versionId}/preview.webp
design/{designId}/drape/{drapeId}/{view}.webp
```
Never the user's original filename — `artwork_assets.id` (a generated UUID) is the only thing that touches the storage key. Original filename, if wanted for UI display, stored separately as a metadata column, never as part of the path.

## Upload validation (Phase 4, server-side only — route handler, not client-side Supabase call)

MIME allowlist (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`), size limit (20MB per §17), re-encode-on-ingest for raster formats via `sharp` (already a dependency) to strip EXIF/metadata and neutralize polyglot-file risk, reject SVGs containing `<script>`/external references (SVG upload is the one format here with real XSS surface — sanitize with a library like `dompurify`'s server-side build or reject SVG uploads entirely if that's judged not worth the risk; flagged as a Phase 4 decision, not resolved here).

## What changes from today

Today, artwork lives as a base64 `dataUrl` string inside the `designs.design` jsonb blob — no object storage is used at all. Phase 4 introduces the bucket + `artwork_assets` table (already in `04-database-schema.md`) and switches `ArtworkLayer.assetId` to reference it instead of embedding the image data inline. This is the single highest-value persistence fix in the whole plan (unblocks realistic file sizes, signed-URL access control, and CDN delivery).
