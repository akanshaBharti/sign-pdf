import React from "react";

export function EmptyPanel({ icon, label }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded bg-slate-50 p-4 text-center text-sm text-slate-500">
      <div className="mb-2 text-slate-400">{icon}</div>
      {label}
    </div>
  );
}
