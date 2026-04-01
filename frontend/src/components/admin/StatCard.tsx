import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon?: ReactNode;
}

export function StatCard({ title, value, trend, isPositive = true, icon }: StatCardProps) {
  return (
    <div className="bg-[#121216] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group relative overflow-hidden">
      {/* Subtle top glow based on state */}
      <div className={`absolute top-0 left-0 w-full h-[2px] ${isPositive ? 'bg-purple-500/50' : 'bg-blue-500/50'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>
      
      <div className="flex items-end gap-3">
        <h2 className="text-3xl font-bold text-white tracking-tight">{value}</h2>
        {icon && <div className="text-zinc-600 mb-1">{icon}</div>}
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
           {/* Simple trend indicator text */}
          <span className={isPositive ? "text-purple-400" : "text-blue-400"}>
            {trend}
          </span>
          <span className="text-zinc-500">from last month</span>
        </div>
      )}
    </div>
  );
}
