import React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut } from "lucide-react";

export function Toolbar({
  activePage,
  pageCount,
  pdfFile,
  searchTerm,
  zoom,
  onPageChange,
  onSearch,
  onSearchTermChange,
  onZoomChange
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 sm:px-5">
      <div className="flex min-w-fit items-center gap-2 text-sm text-slate-600">
        <span className="font-medium">Pages:</span>
        <button
          type="button"
          onClick={() => onPageChange(activePage - 1)}
          disabled={!pdfFile || activePage <= 1}
          className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          title="Previous page"
        >
          <ChevronLeft size={17} />
        </button>
        <input
          aria-label="Current page"
          value={activePage}
          disabled={!pdfFile}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value)) onPageChange(value);
          }}
          className="h-9 w-11 rounded-full border border-slate-200 text-center font-semibold text-slate-700 outline-none focus:border-emerald-500 disabled:bg-slate-50"
        />
        <button type="button" className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100" title="Page options">
          <ChevronDown size={16} />
        </button>
        <span>of {pageCount || 0}</span>
        <button
          type="button"
          onClick={() => onPageChange(activePage + 1)}
          disabled={!pdfFile || activePage >= pageCount}
          className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          title="Next page"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="relative order-3 min-w-0 flex-[1_1_100%] sm:order-none sm:flex-[1_1_320px] lg:flex-[0_1_620px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          disabled={!pdfFile}
          placeholder={`Search in ${pdfFile?.name || "document"}`}
          className="h-11 w-full rounded border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={() => onSearch(searchTerm)}
          disabled={!pdfFile || !searchTerm.trim()}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-40"
          title="Search"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="ml-auto flex min-w-fit items-center gap-2">
        <button
          type="button"
          onClick={() => onZoomChange(zoom - 0.1)}
          disabled={!pdfFile || zoom <= 0.5}
          className="grid h-9 w-9 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <div className="grid h-9 min-w-20 place-items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700">
          {Math.round(zoom * 100)}%
        </div>
        <button
          type="button"
          onClick={() => onZoomChange(zoom + 0.1)}
          disabled={!pdfFile || zoom >= 2}
          className="grid h-9 w-9 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
      </div>
    </div>
  );
}
