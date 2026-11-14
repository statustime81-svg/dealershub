import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/formatters";
import type { PlatformUser } from "../super-admin.schemas";
const labels={super_admin:"Super Admin",business_admin:"Business Admin",dealer:"Dealer",salesperson:"Salesperson"};
export function UsersTable({users}:{users:PlatformUser[]}){
  return <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[950px] text-left text-sm">
    <caption className="sr-only">Platform user directory</caption><thead className="bg-soft text-xs text-muted"><tr>
      {["User","Phone","Assigned roles","Team memberships","Email","Registered"].map(label=><th key={label} scope="col" className="px-4 py-3">{label}</th>)}
    </tr></thead><tbody className="divide-y divide-border">{users.map(user=><tr key={user.id} className="hover:bg-soft/50">
      <td className="px-4 py-3"><p className="font-medium">{user.name||"Name not provided"}</p><p className="mt-1 text-xs text-muted">{user.email||"No email"}</p></td>
      <td className="px-4 py-3">{user.phone||"—"}</td><td className="px-4 py-3"><div className="flex max-w-xs flex-wrap gap-1">
        {user.roles.length?user.roles.map(role=><Badge key={role} variant={role==="super_admin"?"info":"neutral"}>{labels[role]}</Badge>):<span className="text-xs text-muted">No assigned role</span>}
      </div></td><td className="px-4 py-3 font-mono text-xs">{user.businessCount}</td>
      <td className="px-4 py-3"><Badge variant={user.emailVerified?"success":"warning"}>{user.emailVerified?"Verified email":"Unverified email"}</Badge></td>
      <td className="px-4 py-3 text-xs">{formatDateTime(user.createdAt)}</td>
    </tr>)}</tbody>
  </table></div>;
}
