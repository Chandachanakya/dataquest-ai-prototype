-- Phase 0: Add confidence_score to decision_logs
-- Run this migration in your Supabase SQL editor

ALTER TABLE decision_logs ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0;
