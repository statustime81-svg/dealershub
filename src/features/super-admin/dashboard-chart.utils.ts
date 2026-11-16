export interface TrendDay {day:string;orders:number;value:number;}
export function dashboardRange(days:number,now=new Date()){
  const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1));
  const start=new Date(end);start.setUTCDate(start.getUTCDate()-days);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
export function completeTrend(rows:TrendDay[],from:string,to:string):TrendDay[]{
  const map=new Map(rows.map(row=>[row.day.slice(0,10),row]));const result:TrendDay[]=[];
  const end=Date.parse(to+"T00:00:00Z");
  for(let cursor=Date.parse(from+"T00:00:00Z");cursor<end;cursor+=86400000){
    const day=new Date(cursor).toISOString().slice(0,10);const row=map.get(day);
    result.push({day,orders:row?.orders??0,value:row?.value??0});
  }return result;
}
export function compactAxis(value:number){
  if(value>=10000000)return `${(value/10000000).toFixed(1)}Cr`;
  if(value>=100000)return `${(value/100000).toFixed(1)}L`;
  if(value>=1000)return `${(value/1000).toFixed(1)}K`;
  return String(Math.round(value));
}
