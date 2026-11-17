import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as auth from "@/features/auth/api/authApi";
export const userKey=["current-user"];
export function useMe(){return useQuery({queryKey:userKey,queryFn:auth.me,retry:false});}
export function useLogin(){const qc=useQueryClient();return useMutation({mutationFn:auth.login,onSuccess:user=>qc.setQueryData(userKey,user)});}
export function useRegister(){const qc=useQueryClient();return useMutation({mutationFn:auth.register,onSuccess:()=>qc.invalidateQueries({queryKey:userKey})});}
export function useLogout(){const qc=useQueryClient();return useMutation({mutationFn:auth.logout,onSuccess:()=>{qc.setQueryData(userKey,null);qc.clear();}});}
