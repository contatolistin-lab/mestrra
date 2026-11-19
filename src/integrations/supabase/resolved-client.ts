import { isDemoMode } from "@/lib/demo-mode";
import { supabase as generatedSupabase } from "./client";
import { demoSupabase } from "./demo-client";

export const supabase = (isDemoMode
  ? demoSupabase
  : generatedSupabase) as unknown as typeof generatedSupabase;
