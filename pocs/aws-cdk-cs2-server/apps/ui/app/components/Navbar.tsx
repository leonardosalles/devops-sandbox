"use client";

import { motion, type MotionProps } from "framer-motion";
import type { HTMLAttributes } from "react";

type MotionHeaderProps = HTMLAttributes<HTMLElement> & MotionProps;
const MotionHeader = (motion as any).header as React.FC<MotionHeaderProps>;

export default function Navbar({ onHost }: { onHost?: () => void }) {
  return (
    <MotionHeader
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-[#091018]/80 border-b border-gray-800 p-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent rounded flex items-center justify-center text-black font-bold">
            CS2
          </div>
          <div>
            <div className="text-lg font-semibold">CS2 PRO MANAGER</div>
            <div className="text-xs text-gray-400">
              Manage matches • 5v5 • Modded
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onHost}
            className="px-3 py-2 bg-accent hover:opacity-90 rounded-md font-bold"
          >
            Host New
          </button>
        </div>
      </div>
    </MotionHeader>
  );
}
