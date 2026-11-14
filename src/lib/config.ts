export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Cloud Mode is enabled only when both Supabase values are present at build time. */
export const isCloudConfigured = Boolean(supabaseUrl && supabaseAnonKey);
