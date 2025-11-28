import { LucideIcon } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats?: Array<{ label: string; value: string }>;
}

export default function PlaceholderView({ title, description, icon: Icon, stats }: PlaceholderViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-6"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-xl p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl">
            <Icon className="text-cyan-400" size={48} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-3">{title} Database</h3>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          This section is ready to display data from external APIs. Configure your data sources to populate the database with real-time information.
        </p>
        <div className="inline-flex gap-2">
          <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400">
            API Ready
          </div>
          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
            Database Configured
          </div>
        </div>
      </div>
    </div>
  );
}
