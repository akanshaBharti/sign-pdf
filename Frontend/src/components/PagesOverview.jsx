import React from "react";
import { FileText, X } from "lucide-react";
import { EmptyPanel } from "./EmptyPanel";

export function PagesOverview({
  activePage,
  className = "flex min-h-0 flex-col border-b border-slate-200 bg-white px-3 pb-3 pt-4 lg:border-b-0 lg:border-r",
  itemClassName = "w-32 shrink-0 rounded border p-2 text-left transition lg:w-full",
  listClassName = "flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-1 lg:block lg:space-y-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1",
  onClose,
  onPageSelect,
  pages,
  thumbnailCanvasRefs,
  thumbnailRefs
}) {
  return (
    <aside className={className}>
      <div className="mb-3 flex shrink-0 items-center justify-between lg:mb-4">
        <h2 className="text-sm font-semibold text-slate-800">Pages Overview</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{pages.length || 0}</span>
          {onClose ? (
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100" title="Close panel">
              <X size={17} />
            </button>
          ) : null}
        </div>
      </div>
      <div className={listClassName}>
        {pages.length === 0 ? (
          <EmptyPanel icon={<FileText size={26} />} label="PDF pages will appear here." />
        ) : (
          pages.map((page) => (
            <button
              type="button"
              key={page.pageNumber}
              ref={(node) => {
                thumbnailRefs.current[page.pageNumber] = node;
              }}
              onClick={() => {
                onPageSelect(page.pageNumber);
              }}
              className={`${itemClassName} ${
                activePage === page.pageNumber
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-center rounded bg-slate-100 p-2">
                <canvas
                  ref={(node) => {
                    thumbnailCanvasRefs.current[page.pageNumber] = node;
                  }}
                  className="block max-w-full bg-white shadow-sm"
                  aria-label={`Page ${page.pageNumber} preview`}
                />
              </div>
              <div className="mt-2 text-center text-xs font-semibold text-slate-600">Page {page.pageNumber}</div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
