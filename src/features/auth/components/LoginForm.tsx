import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema,type LoginValues } from "../auth.schemas";
export function LoginForm({onSubmit,error}:{onSubmit:(values:LoginValues)=>Promise<void>;error?:string}){const{register,handleSubmit,formState:{errors,isSubmitting}}=useForm<LoginValues>({resolver:zodResolver(loginSchema),defaultValues:{email:'',password:''}});return <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}><Input label="Email" type="email" autoComplete="email" required {...register('email')} error={errors.email?.message} disabled={isSubmitting}/><Input label="Password" type="password" autoComplete="current-password" required {...register('password')} error={errors.password?.message} disabled={isSubmitting}/>{error&&<p role="alert" className="text-sm text-danger">{error}</p>}<Button type="submit" className="w-full" isLoading={isSubmitting}>Sign in</Button></form>;}
