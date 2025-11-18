"use client";
export default function HUD({ stats }: { stats: any }) {
  return (
    <aside className="hud fixed left-6 top-20 glass p-4 rounded-2xl shadow-xl">
      <div className="mb-3 text-sm text-gray-300">Server HUD</div>
      <div className="kv">Online Matches</div>
      <div className="text-2xl font-mono font-bold">{stats?.matches || 0}</div>
      <div className="mt-3 kv">Players</div>
      <div className="text-lg font-bold">{stats?.players || 0}</div>
      <div className="mt-4 border-t border-gray-700 pt-3 text-xs text-gray-400">
        RCON Status: <span className="text-green-400">OK</span>
      </div>
    </aside>
  );
}
