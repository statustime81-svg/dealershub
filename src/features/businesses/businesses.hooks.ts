import { useQuery } from "@tanstack/react-query";
import { getBusinessCategories } from "./businesses.api";
export { useBusiness } from "@/hooks/useBusiness";
export function useBusinessCategories(){return useQuery({queryKey:["business-categories"],queryFn:({signal})=>getBusinessCategories(signal)});}
