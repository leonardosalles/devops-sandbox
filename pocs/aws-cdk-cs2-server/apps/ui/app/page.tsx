"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import useSWR from "swr";
import Modal from "./components/Modal";
import Navbar from "./components/Navbar";
import Particles from "./components/Particles";
import ServerCard from "./components/ServerCard";
import LoadingButton from "./components/LoadingButton";

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
  const [loadingAction, setLoadingAction] = useState(false);
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
      const response = await fetch(api + "servers", { method: "POST" });
      mutate();

      if (response.ok) {
        toast.success("Server created successfully");
      } else {
        toast.error("Failed to create server");
      }
    } finally {
      setLoading(false);
    }
  }

  async function action(id: string, a: string) {
    try {
      setLoadingAction(true);
      const response = await fetch(`${api}servers/${id}/${a}`, {
        method: "POST",
      });
      mutate();
      if (response.ok) {
        toast.success(
          `${a.charAt(0).toUpperCase() + a.slice(1)} completed successfully`
        );
      } else {
        toast.error(
          `${a.charAt(0).toUpperCase() + a.slice(1)} failed: ${
            response.statusText
          }`
        );
      }
    } catch (error) {
      toast.error(`${a.charAt(0).toUpperCase() + a.slice(1)} failed: ${error}`);
    } finally {
      setLoadingAction(false);
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

  const handleModalClose = async () => {
    if (!selectedServer) return;
    if (rconConnection) {
      await fetch(`/api/rcon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: selectedServer.publicIp,
          password: rconPassword,
          command: "disconnected",
        }),
      });
      setRconConnection(null);
      setIsConnected(false);
      toast.success("Rcon disconnected successfully");
    }
    setRconModalOpen(false);
    setCustomCommand("");
  };

  const sendRconCommand = async (command: string) => {
    if (!rconConnection || !selectedServer) return;
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
          command,
        }),
      });
      const result = await response.json();
      if (result.response === "") {
        toast.success("Command sent successfully");
      } else {
        toast.error(result.response);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Particles />
      <Navbar onHost={hostNew} loading={loading} />

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
                  loading={loadingAction}
                  instanceId={s.instanceId}
                  onAction={(id, a) => {
                    if (loadingAction) return;
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
              <div className="mt-3 flex flex-col gap-2">
                <LoadingButton
                  onClick={() => hostNew()}
                  loading={loading}
                  className="px-3 py-2 bg-accent text-black rounded-md font-bold"
                >
                  Create Server
                </LoadingButton>

                <LoadingButton
                  onClick={() => fetch(api + "servers")}
                  loading={loading}
                  className="px-3 py-2 bg-slate-700 rounded-md"
                >
                  Refresh
                </LoadingButton>
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
                <div className="flex flex-col gap-6 mt-4">
                  <div>
                    <h3 className="text-md font-semibold mb-2">
                      Common Commands
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => sendRconCommand("bot_kick")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Bot Kick
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_warmup_end")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Warmup End
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_restartgame 1")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Restart Game
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_freezetime 0")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Remove Freezetime
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_pause_match")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Pause
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_unpause_match")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Unpause
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_startmoney 1000")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Set money 1k
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_startmoney 10000")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Set money 10k
                      </button>

                      <button
                        onClick={() => sendRconCommand("mp_startmoney 16000")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Set money 16k
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold mb-2">Server Maps</h3>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "Dust2", cmd: "de_dust2" },
                        { name: "Mirage", cmd: "de_mirage" },
                        { name: "Inferno", cmd: "de_inferno" },
                        { name: "Nuke", cmd: "de_nuke" },
                        { name: "Overpass", cmd: "de_overpass" },
                        { name: "Vertigo", cmd: "de_vertigo" },
                        { name: "Ancient", cmd: "de_ancient" },
                        { name: "Anubis", cmd: "de_anubis" },
                      ].map((map) => (
                        <button
                          key={map.cmd}
                          onClick={() =>
                            sendRconCommand(`changelevel ${map.cmd}`)
                          }
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                        >
                          {map.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendRconCommand(customCommand);
                      setCustomCommand("");
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Enter custom command"
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded bg-cs2panel mt-2"
                    />
                    <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                      Send Custom Command
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
