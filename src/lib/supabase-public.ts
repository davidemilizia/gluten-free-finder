import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) throw new Error("Variabili Supabase mancanti.");

export const supabasePublic = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
