import React from "react";
import { FileSignature, Loader2 } from "lucide-react";
import { BRAND_COLOR } from "../constants";

export function AppHeader({ placement, status, onSign }) {
  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-nowrap sm:px-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded text-white" style={{ backgroundColor: BRAND_COLOR }}>
          <FileSignature size={19} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-950">Sign PDF</h1>
          <p className="truncate text-xs text-slate-500">Upload, place signature, download</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSign}
        disabled={!placement || Boolean(status && status !== "Signed PDF downloaded.")}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
      >
        {status === "Creating signed PDF..." ? <Loader2 className="animate-spin" size={17} /> : <FileSignature size={17} />}
        Sign and Download
      </button>
    </header>
  );
}
