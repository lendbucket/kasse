-- =============================================================
-- P0.H PR 3 — Locale fields for i18n
-- Migration: p0h_pr3_locale_fields
-- Adds locale columns to User and Organization tables
-- No RLS changes — columns inherit existing table policies
-- =============================================================

-- User.locale — per-user language preference (highest priority in detection chain)
ALTER TABLE public."User" ADD COLUMN "locale" TEXT;

-- Organization.defaultLocale — org-wide fallback for customer-facing pages
ALTER TABLE public."Organization" ADD COLUMN "defaultLocale" TEXT NOT NULL DEFAULT 'en-US';
