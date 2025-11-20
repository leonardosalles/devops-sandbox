"use client";
import useSWR from "swr";
import { useState } from "react";
import Navbar from "./components/Navbar";
import HUD from "./components/HUD";
import ServerCard from "./components/ServerCard";
import Particles from "./components/Particles";
import Modal from "./components/Modal";
import { toast } from "react-toastify";

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
  const [isRconModalOpen, setRconModalOpen] = useState(false);
  const [rconPassword, setRconPassword] = useState("");
  const [selectedServer, setSelectedServer] = useState<{
    id: string;
    publicIp: string;
  } | null>(null);
  const [rconConnection, setRconConnection] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [customCommand, setCustomCommand] = useState("");

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

  const handleRconConnect = async () => {
    if (!selectedServer) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/rcon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: selectedServer.publicIp,
          password: rconPassword,
          command: "connect",
        }),
      });
      const connection = await response.json();
      setRconConnection(connection);
      setIsConnected(true);
      toast.success("Rcon connected successfully");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    if (rconConnection) {
      rconConnection.end().then(() => {
        setRconConnection(null);
        setIsConnected(false);
      });
    }
    setRconModalOpen(false);
  };

  const sendRconCommand = async (command: string) => {
    if (!rconConnection || !selectedServer) return;
    try {
      setLoading(true);
      await fetch(`/api/rcon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: selectedServer.publicIp,
          password: rconPassword,
          command,
        }),
      });
    } finally {
      setLoading(false);
    }
  };

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
                <ServerCard
                  key={s.id}
                  s={s}
                  onAction={(id, a) => {
                    if (a === "rcon") {
                      setSelectedServer(s);
                      setRconModalOpen(true);
                    } else {
                      action(id, a);
                    }
                  }}
                />
              ))}
          </div>
          <div className="w-80">
            <div className="glass p-4 rounded-2xl shadow-xl">
              <div className="text-sm text-gray-400">Quick Actions</div>
              <div className="mt-3 flex gap-2">
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
      {isRconModalOpen && (
        <Modal onClose={handleModalClose}>
          <div className="p-4">
            <h2 className="text-lg font-bold">
              Rcon {isConnected ? "" : "Connect"}
            </h2>
            {!isConnected && (
              <>
                <input
                  type="password"
                  placeholder="Enter Rcon Password"
                  value={rconPassword}
                  onChange={(e) => setRconPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mt-2 bg-cs2panel"
                />
                <button
                  onClick={handleRconConnect}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Connect
                </button>
              </>
            )}
            {isConnected && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendRconCommand("bot_kick")}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Bot Kick
                    </button>
                    <button
                      onClick={() => sendRconCommand("warmup_end")}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Warmup End
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter custom command"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mt-2 bg-cs2panel"
                  />
                  <button
                    onClick={() => sendRconCommand(customCommand)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Send Custom Command
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
