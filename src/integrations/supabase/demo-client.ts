import { applyDemoRestock, applyDemoSale, getDemoData } from "@/lib/demo-store";

let signedIn = true;

const user = {
  id: getDemoData().userId,
  email: "demo@mestrra.local",
  app_metadata: {},
  user_metadata: { full_name: "Modo demo" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

const session = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user,
};

type Filter = { column: string; value?: unknown; values?: unknown[] };

function result(data: unknown) {
  return Promise.resolve({ data, error: null });
}

function generatedId() {
  return `demo-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function targetRows(table: string): unknown[] {
  const state = getDemoData() as unknown as Record<string, unknown>;
  const keys: Record<string, string> = {
    inventory_items: "inventory",
    catalog_items: "catalog",
    catalog_recipes: "recipes",
    orders: "orders",
    cashflow_transactions: "cash",
  };
  const key = keys[table];
  if (!key) return [];
  const value = state[key];
  return Array.isArray(value) ? value : [];
}

function matches(row: unknown, filters: Filter[]) {
  const values = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  return filters.every((filter) => {
    if (filter.values) return filter.values.includes(values[filter.column]);
    return values[filter.column] === filter.value;
  });
}

function storedRows(table: string): unknown[] {
  if (table === "profiles") {
    const profile = (getDemoData() as unknown as { profile: unknown }).profile;
    return profile ? [profile] : [];
  }
  return targetRows(table);
}

type DemoBuilder = Record<string, unknown>;

function createBuilder(table: string): DemoBuilder {
  let operation: "select" | "insert" | "update" | "delete" = "select";
  let payload: unknown;
  let single = false;
  const filters: Filter[] = [];

  const builder: DemoBuilder = new Proxy<DemoBuilder>(
    {},
    {
      get(_target, property: string | symbol) {
        const prop = String(property);
        if (prop === "then") {
          return (resolve: (value: unknown) => unknown) => resolve(resolveData());
        }
        if (prop === "select") return () => builder;
        if (prop === "insert" || prop === "upsert") {
          return (rows: unknown) => {
            operation = "insert";
            payload = rows;
            return builder;
          };
        }
        if (prop === "update") {
          return (values: unknown) => {
            operation = "update";
            payload = values;
            return builder;
          };
        }
        if (prop === "delete") {
          return () => {
            operation = "delete";
            return builder;
          };
        }
        if (prop === "single" || prop === "maybeSingle") {
          single = true;
          return () => builder;
        }
        if (prop === "eq") {
          return (column: string, value: unknown) => {
            filters.push({ column, value });
            return builder;
          };
        }
        if (prop === "in") {
          return (column: string, values: unknown[]) => {
            filters.push({ column, values });
            return builder;
          };
        }
        if (
          prop === "neq" ||
          prop === "order" ||
          prop === "limit" ||
          prop === "range" ||
          prop === "gte" ||
          prop === "lte"
        ) {
          return () => builder;
        }
        if (prop === "unsubscribe") return () => {};
        return builder;
      },
    },
  );

  function resolveData() {
    const rows = targetRows(table);
    if (operation === "insert") {
      const input = Array.isArray(payload) ? payload : [payload];
      const saved = input.map((row) => {
        const values = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        return { ...values, id: values["id"] ?? generatedId() };
      });
      rows.push(...saved);
      payload = saved;
      return { data: single ? saved[0] : saved, error: null };
    }
    if (operation === "update") {
      const values =
        payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
      const affected = rows.filter((row) => matches(row, filters));
      for (const row of affected) Object.assign(row as object, values);
      return { data: single ? affected[0] : affected, error: null };
    }
    if (operation === "delete") {
      const kept = rows.filter((row) => !matches(row, filters));
      rows.splice(0, rows.length, ...kept);
      return { data: null, error: null };
    }
    const found = storedRows(table).filter((row) => matches(row, filters));
    if (table === "profiles") return { data: found[0] ?? null, error: null };
    return { data: single ? (found[0] ?? null) : found, error: null };
  }

  return builder;
}

export const demoSupabase = {
  auth: {
    getUser: () => result(signedIn ? { user } : { user: null }),
    getSession: () => result(signedIn ? { session } : { session: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: () => {
      signedIn = true;
      return result({ user, session });
    },
    signUp: () => {
      signedIn = true;
      return result({ user, session });
    },
    resetPasswordForEmail: () => result({}),
    updateUser: () => result({ user }),
    signOut: () => {
      signedIn = false;
      return result({});
    },
  },
  from: (table: string) => createBuilder(table),
  rpc: (name: string, args?: Record<string, unknown>) => {
    try {
      if (name === "create_sale") {
        return result(
          applyDemoSale({
            itemId: String(args?.["p_item"]),
            quantity: Number(args?.["p_quantity"] ?? 1),
          }),
        );
      }
      if (name === "restock_item") {
        applyDemoRestock({
          id: String(args?.["p_id"]),
          quantity: Number(args?.["p_quantity"] ?? 0),
          promo: args?.["p_promo"] === true,
        });
      }
      return result(null);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  functions: {
    invoke: () => result({ url: "#demo", init_point: "#demo", id: "demo" }),
  },
  channel: () => {
    const channel = {
      on: () => channel,
      subscribe: () => channel,
      unsubscribe: () => {},
    };
    return channel;
  },
  removeChannel: () => {},
};
