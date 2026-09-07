/*
# Create public music catalog for HitFacil PRO

## Purpose
Create the durable catalog used by the Músicas em Alta page. Generated songs
can be published by the server, while visitors can browse the public catalog.

## New table: `public_tracks`
- `id`: unique track identifier.
- `title`: displayed song title.
- `genre`, `mood`, `voice`: generation metadata.
- `lyrics`: lyrics shown in the player and video lyric view.
- `audio_url`: generated MP3/stream URL.
- `cover_url`: square cover image URL.
- `duration`: track length in seconds.
- `plays`: public popularity counter.
- `is_public`: whether the song is visible in Músicas em Alta.
- `created_at`: creation timestamp.

## Security
- RLS is enabled.
- Anonymous and authenticated visitors can read public tracks.
- Client roles cannot insert, update, or delete catalog rows. The generation
  Edge Function uses the service role when publishing a completed track.
*/

CREATE TABLE IF NOT EXISTS public_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  genre text NOT NULL DEFAULT 'Pop',
  mood text NOT NULL DEFAULT 'Happy',
  voice text NOT NULL DEFAULT 'Dueto',
  lyrics text NOT NULL DEFAULT '',
  audio_url text NOT NULL,
  cover_url text,
  duration numeric NOT NULL DEFAULT 180,
  plays integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_tracks" ON public_tracks;
CREATE POLICY "public_read_tracks" ON public_tracks FOR SELECT
  TO anon, authenticated USING (is_public = true);

DROP POLICY IF EXISTS "public_insert_tracks" ON public_tracks;
CREATE POLICY "public_insert_tracks" ON public_tracks FOR INSERT
  TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "public_update_tracks" ON public_tracks;
CREATE POLICY "public_update_tracks" ON public_tracks FOR UPDATE
  TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "public_delete_tracks" ON public_tracks;
CREATE POLICY "public_delete_tracks" ON public_tracks FOR DELETE
  TO anon, authenticated USING (false);

CREATE INDEX IF NOT EXISTS public_tracks_trending_idx
  ON public_tracks (is_public, plays DESC, created_at DESC);