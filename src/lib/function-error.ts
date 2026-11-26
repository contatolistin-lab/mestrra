export async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = (await context.json()) as { error?: unknown; message?: unknown };
      const message =
        typeof body.error === "string"
          ? body.error
          : typeof body.message === "string"
            ? body.message
            : null;
      if (message && !/MP_[A-Z_]+|SUPABASE_[A-Z_]+|secret/i.test(message)) return message;
    } catch {
      return fallback;
    }
  }
  if (error instanceof Error && error.message && !/non-2xx/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
