"use client";

import { motion, type MotionProps } from "framer-motion";
import type { HTMLAttributes } from "react";

type MotionDivProps = HTMLAttributes<HTMLDivElement> & MotionProps;

export default function ServerCard({
  s,
  onAction,
}: {
  s: any;
  onAction: (id: string, a: string) => void;
}) {
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
          <div
            className={`font-semibold ${
              s.state === "running"
                ? "text-green-400"
                : s.state === "stopped"
                ? "text-gray-400"
                : "text-yellow-400"
            }`}
          >
            {s.state.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="mt-3 mb-4">
        <div className="text-sm text-gray-400">Instance</div>
        <div className="font-mono">{s.instanceId || "-"}</div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => onAction(s.id, "start")}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Start
        </button>
        <button
          onClick={() => onAction(s.id, "stop")}
          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
        >
          Stop
        </button>
        <button
          onClick={() => onAction(s.id, "restart")}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Restart
        </button>
        <button
          onClick={() => onAction(s.id, "terminate")}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Terminate
        </button>
      </div>
    </motion.div>
  );
}
