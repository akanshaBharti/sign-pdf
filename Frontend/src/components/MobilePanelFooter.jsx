import React from "react";
import { FileSignature, Layers3 } from "lucide-react";

export function MobilePanelFooter({ pageCount, signatureReady, onOpenPages, onOpenSignature }) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-12px_36px_rgba(15,23,42,0.12)] lg:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-4 text-sm font-semibold text-slate-500">
        <button type="button" onClick={onOpenPages} className="flex min-w-0 items-center gap-2 rounded px-1 py-2 text-left hover:text-slate-800">
          <Layers3 size={22} />
          <span className="truncate">{pageCount || 0} pages</span>
        </button>
        <button type="button" onClick={onOpenSignature} className="flex min-w-0 items-center gap-2 rounded px-1 py-2 text-left hover:text-slate-800">
          <FileSignature size={21} />
          <span className="truncate">{signatureReady ? "Signature" : "No signature"}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenSignature}
        className="h-11 shrink-0 rounded bg-emerald-600 px-4 text-sm font-semibold text-white  transition hover:bg-indigo-600"
      > 
        Open Panel
      </button>
    </footer>
  );
}
