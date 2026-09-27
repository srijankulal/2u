import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  process.env?.['VITE_SUPABASE_URL'] ||
  process.env?.['SUPABASE_URL'] ||
  'https://pcqqvudxwjpupovhvyuj.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_KEY) ||
  process.env?.['VITE_SUPABASE_KEY'] ||
  process.env?.['SUPABASE_KEY'] ||
  'sb_publishable_x78OqXS8DxH7G2q-AzXLhA_J-ZHV9dO';

export const supabase = createClient(supabaseUrl, supabaseKey);
