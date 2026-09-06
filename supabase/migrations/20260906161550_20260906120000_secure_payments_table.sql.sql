/*
# Secure payments table — prevent payment bypass

## Problem
The original migration granted full table-level UPDATE and DELETE to the anon
role (Postgres grants all four DML verbs by default when a policy exists).
Combined with the `anon_insert_payments` policy using `WITH CHECK (true)`, any
anonymous caller could:
  - INSERT a row with `is_paid = true` and skip payment entirely.
  - UPDATE an existing row to flip `is_paid` to true.
  - DELETE payment records.

## Changes
1. Revoke UPDATE and DELETE from anon and authenticated on the `payments` table.
   Only the webhook (using the service role key) updates payment status.
2. Revoke INSERT on the full table, then grant INSERT only on the columns the
   client legitimately provides: `email`, `mp_payment_id`, `status`, `amount`,
   `pix_code`, `pix_qr_code`. The `is_paid` column is NOT insertable by the
   client — the edge function sets it, and the webhook flips it.
3. Replace the overly-permissive `anon_insert_payments` policy with one that
   has a proper WITH CHECK that prevents setting `is_paid` to true on insert.
4. Keep the SELECT policy so the client can poll payment status.

## Security
- RLS remains enabled.
- anon/authenticated: SELECT (read status), INSERT (limited columns, cannot set is_paid).
- UPDATE/DELETE: revoked from anon and authenticated — only service role can update.
*/

-- Revoke all DML verbs from both roles so we can grant precisely
REVOKE UPDATE, DELETE ON payments FROM anon, authenticated;

-- Revoke full-table INSERT, then grant only on safe columns
REVOKE INSERT ON payments FROM anon, authenticated;
GRANT INSERT (email, mp_payment_id, status, amount, pix_code, pix_qr_code)
  ON payments TO anon, authenticated;

-- Replace the permissive INSERT policy with a restrictive one
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_paid = false);

-- Keep the SELECT policy (unchanged)
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);