import { demoBusiness } from "@/lib/demo";

const demo = demoBusiness();

let signedIn = true;

const user = {
  id: demo.userId,
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

type TableName =
  | "inventory_items"
  | "catalog_items"
  | "catalog_recipes"
  | "orders"
  | "cashflow_transactions"
  | "profiles";

const tables: Record<TableName, unknown> = {
  inventory_items: demo.inventory,
  catalog_items: demo.catalog,
  catalog_recipes: demo.recipes,
  orders: demo.orders,
  cashflow_transactions: demo.cash,
  profiles: demo.profile,
};

function result(data: unknown) {
  return Promise.resolve({ data, error: null });
}

type DemoBuilder = Record<string, unknown>;

function createBuilder(table: string): DemoBuilder {
  let operation: "select" | "insert" | "update" | "delete" = "select";
  let payload: unknown;

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
        if (prop === "single" || prop === "maybeSingle") return () => builder;
        if (
          prop === "eq" ||
          prop === "neq" ||
          prop === "in" ||
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
    if (operation === "insert" || operation === "update") {
      const row = Array.isArray(payload) ? payload[0] : payload;
      const values = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      return { data: { ...values, id: values["id"] ?? `demo-${Date.now()}` }, error: null };
    }
    if (operation === "delete") return { data: null, error: null };
    return { data: tables[table as TableName] ?? [], error: null };
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
  rpc: (name: string) => result(name === "create_sale" ? `demo-${Date.now()}` : null),
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
