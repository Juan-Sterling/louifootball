import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnnjcwhyyvcetswashku.supabase.co";
const SUPABASE_KEY = "sb_publishable__pCa3Ej5Z0G8Irhdw8sbcg_Se8C31Hy";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
