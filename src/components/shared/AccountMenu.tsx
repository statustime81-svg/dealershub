import { Link,useNavigate } from "react-router-dom";
import { useState } from "react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { signOut } from "@/features/auth/auth.api";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/config/routes";
export function AccountMenu(){const{user}=useAuth();const navigate=useNavigate();const[busy,setBusy]=useState(false);const[error,setError]=useState(false);return <DropdownMenu label="Account"><p className="max-w-64 truncate px-3 py-2 text-xs text-muted">{user?.email}</p><Link className="block px-3 py-2 text-sm" to={routes.onboarding}>My workspace</Link><Button variant="ghost" disabled={busy} onClick={()=>{setBusy(true);setError(false);void signOut().then(()=>navigate(routes.auth.login,{replace:true})).catch(()=>setError(true)).finally(()=>setBusy(false));}}>Sign out</Button>{error&&<p role="alert" className="px-3 text-xs text-danger">Sign out failed. Try again.</p>}</DropdownMenu>;}
