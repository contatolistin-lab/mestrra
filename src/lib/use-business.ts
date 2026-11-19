import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessQuery } from "./business-query";
import type { BusinessData } from "./business.functions";

export function useBusiness() {
  return useQuery(businessQuery);
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
