const SUPABASE_URL = "https://jqguibaxagunlpyicnmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jjNYHSvSj_jDluW4PP5IUQ_1tgtFLBk";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;
