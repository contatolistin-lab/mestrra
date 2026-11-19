import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessQuery } from "./business-query";
import { demoBusiness } from "./demo";
import { isDemoMode } from "./demo-mode";
import type { BusinessData } from "./business.functions";

const demoQuery = queryOptions({
  ...businessQuery,
  queryFn: () => Promise.resolve(demoBusiness()),
});

export function useBusiness() {
  return useQuery(isDemoMode ? demoQuery : businessQuery);
}

export function useBusinessData(): BusinessData {
  const { data } = useBusiness();
  if (!data) throw new Error("Os dados do negócio ainda não foram carregados.");
  return data;
}

export function useRefreshBusiness() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["business"] });
}
