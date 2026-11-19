const env = import.meta.env as Record<string, string | undefined>;

function serverEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env?.[name];
}

const url = env["VITE_SUPABASE_URL"] || serverEnv("SUPABASE_URL");
const key = env["VITE_SUPABASE_PUBLISHABLE_KEY"] || serverEnv("SUPABASE_PUBLISHABLE_KEY");

export const isDemoMode = !url || !key;
