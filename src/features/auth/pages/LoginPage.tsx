import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { routes } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { signIn,signOut } from "../auth.api";
import { loginSchema,type LoginValues } from "../auth.schemas";
export default function LoginPage(){
 const navigate=useNavigate(),client=useQueryClient();const{user,isConfigured,isLoading}=useAuth();
 const[formError,setFormError]=useState<string|null>(null),[switching,setSwitching]=useState(false);
 const{register,handleSubmit,reset,setFocus,formState:{errors,isSubmitting}}=useForm<LoginValues>({resolver:zodResolver(loginSchema),defaultValues:{email:"",password:""}});
 async function anotherAccount(){setFormError(null);setSwitching(true);try{await client.cancelQueries();await signOut();client.clear();reset({email:"",password:""});navigate(routes.auth.login,{replace:true});}catch(e){setFormError(getErrorMessage(e,"Unable to sign out. Try again."));}finally{setSwitching(false);}}
 async function submit(values:LoginValues){setFormError(null);try{await signIn(values);navigate(routes.onboarding,{replace:true});}catch(e){setFormError(getErrorMessage(e,"Unable to sign in. Check your email and password."));}}
 if(isLoading)return <p className="text-sm text-muted">Checking your session…</p>;
 if(user)return <section><h2 className="text-2xl font-bold">You are signed in</h2><p className="mt-2 break-all text-sm text-muted">{user.email}</p><div className="mt-5 flex flex-col gap-3"><Link to={routes.onboarding} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-lime px-4 text-sm font-semibold text-midnight">Continue to your account</Link><Button variant="secondary" isLoading={switching} onClick={()=>{void anotherAccount();}}>Sign in with another account</Button></div>{formError&&<p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}</section>;
 return <section aria-labelledby="login-heading"><h2 id="login-heading" className="text-2xl font-bold tracking-tight">Welcome back</h2><p className="mt-2 text-sm leading-6 text-muted">Sign in with the email and password provided by your administrator.</p>{!isConfigured&&<p role="alert" className="mt-4 text-sm text-danger">Account service is not configured.</p>}<form noValidate onSubmit={handleSubmit(submit)} className="mt-6 space-y-5"><Input {...register("email")} label="Email address" type="email" autoComplete="username" required disabled={isSubmitting} error={errors.email?.message}/><Input {...register("password")} label="Password" type="password" autoComplete="current-password" required disabled={isSubmitting} error={errors.password?.message}/>{formError&&<p role="alert" className="text-sm text-danger">{formError}</p>}<Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!isConfigured}>Sign in</Button><Button type="button" variant="secondary" className="w-full" disabled={isSubmitting} onClick={()=>{reset({email:"",password:""});setFormError(null);setFocus("email");}}>Sign in with another account</Button></form><p className="mt-5 text-xs leading-5 text-muted">Need an account or a password reset? Contact your administrator.</p></section>;
}
