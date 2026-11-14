import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { QueryState } from "@/components/shared/QueryState";
import { PageHeader } from "@/components/shared/PageHeader";
import { getProfile } from "../profile.api";
import { ProfileForm } from "../components/ProfileForm";
export default function ProfilePage(){
 const{user}=useAuth();const q=useQuery({queryKey:["user",user?.id,"profile"],enabled:Boolean(user),queryFn:({signal})=>getProfile(user!.id,signal)});
 return <div className="space-y-6"><PageHeader title="Profile" description="Manage your contact and dealer business details."/><p className="text-sm text-muted">Login email: {user?.email}</p><QueryState pending={q.isPending} error={q.isError} retry={q.refetch}>{q.data&&<><ProfileForm key={q.data.profile.updated_at} profile={q.data.profile}/>{q.data.dealer&&<ProfileForm key={q.data.dealer.updated_at} profile={q.data.profile} dealer={q.data.dealer}/>}</>}</QueryState></div>;
}
