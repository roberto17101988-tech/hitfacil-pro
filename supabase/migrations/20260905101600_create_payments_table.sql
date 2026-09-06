/*
# Create payments table for PIX upgrade flow

1. New Tables
- `payments`
  - `id` (uuid, primary key)
  - `email` (text, not null) — the buyer's email
  - `mp_payment_id` (bigint, unique) — Mercado Pago payment ID
  - `status` (text, not null, default 'pending') — pending | approved | cancelled | rejected
  - `amount` (numeric, not null, default 19.90)
  - `pix_code` (text) — the copy-paste PIX code
  - `pix_qr_code` (text) — base64 QR code image
  - `is_paid` (boolean, not null, default false) — whether the payment is confirmed
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `payments`.
- Allow anon + authenticated to INSERT (creating a new payment) and SELECT (checking status).
- UPDATE is NOT granted to anon — only the webhook (service role) updates status.
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  mp_payment_id bigint UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL DEFAULT 19.90,
  pix_code text,
  pix_qr_code text,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert new payments
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Allow anon to read payments (needed to poll status by id)
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);
