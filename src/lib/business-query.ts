import { queryOptions } from '@tanstack/react-query';
import { getBusiness } from './business.functions';
export const businessQuery = queryOptions({ queryKey: ['business'], queryFn: () => getBusiness(), staleTime: 30_000 });