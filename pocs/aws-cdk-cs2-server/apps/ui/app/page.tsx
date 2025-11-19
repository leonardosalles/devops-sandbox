"use client";
import useSWR from "swr";
import { useState } from "react";
import Navbar from "./components/Navbar";
import HUD from "./components/HUD";
import ServerCard from "./components/ServerCard";
import Particles from "./components/Particles";

export const dynamic = "force-static";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Page() {
  const api =
    typeof window !== "undefined"
      ? (window as any).runtimeEnv?.NEXT_PUBLIC_API_URL
      : process.env.NEXT_PUBLIC_API_URL;

  const { data: servers, mutate } = useSWR(
    api ? api + "servers" : null,
    fetcher,
    {
      refreshInterval: 3000,
    }
  );

  const [loading, setLoading] = useState(false);

  async function hostNew() {
    try {
      setLoading(true);
      await fetch(api + "servers", { method: "POST" });
      mutate();
    } finally {
      setLoading(false);
    }
  }

  async function action(id: string, a: string) {
    try {
      setLoading(true);
      await fetch(`${api}servers/${id}/${a}`, { method: "POST" });
      mutate();
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    matches: servers ? servers.length : 0,
    players: (servers || []).reduce(
      (acc: any, s: any) => acc + (s.players || 0),
      0
    ),
  };

  return (
    <div>
      <Particles />
      <Navbar onHost={hostNew} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start gap-6">
          <div className="flex-1 min-w-0">
            {!servers && (
              <div className="text-center text-gray-400 animate-pulse">
                Loading servers...
              </div>
            )}
            {servers && servers.length === 0 && (
              <div className="text-center text-gray-400">
                No servers running yet.
              </div>
            )}
            {servers &&
              servers.map((s: any) => (
                <ServerCard key={s.id} s={s} onAction={action} />
              ))}
          </div>
          <div className="w-80">
            <div className="glass p-4 rounded-2xl shadow-xl">
              <div className="text-sm text-gray-400">Quick Actions</div>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => hostNew()}
                  className="px-3 py-2 bg-accent text-black rounded-md font-bold"
                >
                  Host New Server
                </button>
                <button
                  onClick={() => fetch(api + "servers")}
                  className="px-3 py-2 bg-slate-700 rounded-md"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
