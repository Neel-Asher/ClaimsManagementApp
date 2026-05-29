import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'blue', className = '' }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
  };

  const iconColorMap = {
    blue: 'text-blue-400 bg-blue-500/15',
    green: 'text-emerald-400 bg-emerald-500/15',
    amber: 'text-amber-400 bg-amber-500/15',
    red: 'text-red-400 bg-red-500/15',
    violet: 'text-violet-400 bg-violet-500/15',
    cyan: 'text-cyan-400 bg-cyan-500/15',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div
      className={`
        glass-card p-5 bg-gradient-to-br ${colorMap[color]}
        group cursor-default ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconColorMap[color]}`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</p>
      <p className="text-xs text-slate-400 font-medium">{title}</p>
    </div>
  );
}
