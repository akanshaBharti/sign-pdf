import React from "react";
import { Upload, X } from "lucide-react";

export function DocumentViewer({
  documentScrollRef,
  handlePageDrop,
  handlePointerMove,
  handlePdfUpload,
  pageRefs,
  pageRenderRefs,
  pages,
  pdfFile,
  placement,
  searchHighlights,
  setDragging,
  setPlacement,
  signatureUrl
}) {
  return (
    <section ref={documentScrollRef} className="min-w-0 overflow-auto bg-slate-100 p-3 sm:p-4 lg:p-6">
      {!pdfFile ? (
        <label className="mx-auto mt-6 flex max-w-2xl cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-panel transition hover:border-emerald-500 sm:mt-16 sm:py-16">
          <Upload className="mb-4 text-slate-500" size={34} />
          <span className="text-lg font-semibold text-slate-900">Upload your PDF</span>
          <span className="mt-2 max-w-md text-sm text-slate-500">Choose a document to open the signing workspace.</span>
          <input className="hidden" type="file" accept="application/pdf" onChange={handlePdfUpload} />
        </label>
      ) : (
        <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-4 sm:gap-6 lg:min-w-0">
          {pages.map((page) => (
            <div
              key={page.pageNumber}
              ref={(node) => {
                pageRefs.current[page.pageNumber] = node;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handlePageDrop(event, page.pageNumber)}
              onPointerMove={handlePointerMove}
              onPointerUp={() => {
                setDragging(false);
              }}
              className="pdf-page relative overflow-hidden rounded bg-white shadow-panel"
              style={{ width: page.width, minHeight: page.height }}
            >
              <canvas
                ref={(node) => {
                  pageRenderRefs.current[page.pageNumber] = node;
                }}
              />
              {(searchHighlights[page.pageNumber] || []).map((highlight, index) => (
                <div
                  key={`${page.pageNumber}-${index}`}
                  className="pointer-events-none absolute rounded-sm bg-emerald-200/60 ring-1 ring-emerald-300/70"
                  style={{
                    left: highlight.left,
                    top: highlight.top,
                    width: highlight.width,
                    height: highlight.height
                  }}
                />
              ))}
              {placement?.page === page.pageNumber && signatureUrl ? (
                <div
                  onPointerDown={(event) => {
                    if (event.target.closest("[data-delete-signature]")) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging(true);
                  }}
                  className="absolute cursor-move border-2 border-emerald-500 bg-emerald-50/40 p-1"
                  style={{
                    left: placement.x,
                    top: placement.y,
                    width: placement.width,
                    height: placement.height
                  }}
                  title="Drag signature"
                >
                  <img src={signatureUrl} alt="Signature placement" className="h-full w-full object-contain" />
                  <button
                    type="button"
                    data-delete-signature
                    onClick={(event) => {
                      event.stopPropagation();
                      setPlacement(null);
                    }}
                    className="absolute -right-3 -top-3 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600"
                    title="Delete signature"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
