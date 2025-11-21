"use client";

import React from "react";

export default function LoadingButton({
  loading,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        relative px-3 py-2 rounded-md text-white transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <span
        className={`transition-opacity ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </span>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="
              w-4 h-4 border-2 border-white border-t-transparent 
              rounded-full animate-spin
            "
          />
        </div>
      )}
    </button>
  );
}
