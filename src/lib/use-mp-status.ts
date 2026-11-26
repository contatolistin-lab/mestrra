import { queryOptions, useQuery } from "@tanstack/react-query";
import { isDemoMode } from "./demo-mode";
import { getMpStatus } from "./mp-status.functions";
import { deriveMpStatus } from "./mp-status";

export const mpStatusQuery = queryOptions({
  queryKey: ["mp-status"],
  queryFn: () => (isDemoMode ? Promise.resolve(deriveMpStatus(false, null)) : getMpStatus()),
  refetchInterval: 60_000,
});

export function useMpStatus() {
  return useQuery(mpStatusQuery);
}
