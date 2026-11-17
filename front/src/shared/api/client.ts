const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
let csrfToken = "";
export function setCSRFToken(value:string){csrfToken=value;}
export function getCSRFToken(){return csrfToken;}
export class ApiError extends Error {
  constructor(public status:number, message:string){super(message);this.name="ApiError";}
}
export async function api<T>(path:string, init:RequestInit={}):Promise<T>{
  const method=(init.method??"GET").toUpperCase();
  const headers=new Headers(init.headers);
  if(!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) headers.set("Content-Type","application/json");
  if(!["GET","HEAD","OPTIONS"].includes(method) && csrfToken) headers.set("X-CSRF-Token",csrfToken);
  const response=await fetch(`${API_BASE}/api${path}`,{...init,headers,credentials:"include"});
  if(response.status===204) return undefined as T;
  const data=await response.json().catch(()=>null);
  if(!response.ok){const message=data?.error?.message??"Произошла ошибка";throw new ApiError(response.status,message);}
  return data as T;
}
