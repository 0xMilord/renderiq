-- Migration: Drop unified chat_messages table
-- Reason: Removing agent chat persistence and related schema

DROP TABLE IF EXISTS chat_messages CASCADE;

