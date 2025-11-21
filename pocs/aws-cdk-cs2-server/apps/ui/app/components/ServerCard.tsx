"use client";

import { motion, type MotionProps } from "framer-motion";
import type { HTMLAttributes } from "react";
import LoadingButton from "./LoadingButton";

type MotionDivProps = HTMLAttributes<HTMLDivElement> & MotionProps;

export default function ServerCard({
  s,
  onAction,
  loading,
  instanceId,
}: {
  s: any;
  onAction: (id: string, a: string) => void;
  loading: boolean;
  instanceId: string;
}) {
  const normalizedState = (s.state || "").toUpperCase();

  const stateColor =
    normalizedState === "RUNNING"
      ? "text-green-400"
      : normalizedState === "CREATED"
      ? "text-gray-400"
      : normalizedState === "ERROR"
      ? "text-red-400"
      : normalizedState === "INITIALIZING"
      ? "text-yellow-400"
      : "text-gray-400";

  return (
    <motion.div
      {...({
        layout: true,
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        className:
          "bg-cs2panel/80 glass border border-gray-700 rounded-xl p-6 mb-4 shadow-lg",
      } as MotionDivProps)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">ID</div>
          <div className="font-mono text-lg">{s.id}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">State</div>
          <div className={`font-semibold ${stateColor}`}>{normalizedState}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm text-gray-400">Instance</div>
        <div className="font-mono">{s.instanceId || "-"}</div>
      </div>

      <div className="mt-3">
        <div className="text-sm text-gray-400">IP Address</div>

        {s.publicIp ? (
          <div className="flex items-center gap-3">
            <div className="font-mono text-white">{s.publicIp}:27015</div>

            <LoadingButton
              loading={loading}
              onClick={() =>
                navigator.clipboard.writeText(`${s.publicIp}:27015`)
              }
              className="text-xs text-blue-400 hover:underline px-2 py-1"
            >
              Copy
            </LoadingButton>
          </div>
        ) : (
          <div className="text-gray-500 italic">Start server to see IP</div>
        )}
      </div>

      <div className="mt-4 flex gap-3 flex-wrap">
        <LoadingButton
          loading={loading}
          onClick={() => onAction(s.id, "start")}
          className="bg-green-600 hover:bg-green-700"
        >
          Start
        </LoadingButton>

        {instanceId && (
          <>
            <LoadingButton
              loading={loading}
              onClick={() => onAction(s.id, "stop")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Stop
            </LoadingButton>

            <LoadingButton
              loading={loading}
              onClick={() => onAction(s.id, "restart")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restart
            </LoadingButton>
          </>
        )}

        <LoadingButton
          loading={loading}
          onClick={() => onAction(s.id, "terminate")}
          className="bg-red-600 hover:bg-red-700"
        >
          {instanceId ? "Terminate" : "Delete"}
        </LoadingButton>

        {instanceId && s.state === "RUNNING" && (
          <LoadingButton
            loading={loading}
            onClick={() => onAction(s.id, "rcon")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Rcon
          </LoadingButton>
        )}
      </div>
    </motion.div>
  );
}
