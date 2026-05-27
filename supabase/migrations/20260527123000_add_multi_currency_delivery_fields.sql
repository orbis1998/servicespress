-- Migration: add multi-currency payment fields to deliveries
ALTER TABLE public.deliveries
  ADD COLUMN usd_received numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN cdf_received numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN exchange_rate numeric(12,2) NOT NULL DEFAULT 2300,
  ADD COLUMN total_received_usd numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN total_received_cdf numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN commission_usd numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN commission_cdf numeric(12,2) NOT NULL DEFAULT 0;
