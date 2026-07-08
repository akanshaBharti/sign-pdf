import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  FileText,
  Loader2,
  MousePointer2,
  Search,
  Upload,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/sign-pdf/";
const BASE_PDF_SCALE = 0.95;
const THUMBNAIL_WIDTH = 96;
const BRAND_COLOR = "#059669";

function fileToObjectUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [placement, setPlacement] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHighlights, setSearchHighlights] = useState({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const pageRefs = useRef({});
  const pageRenderRefs = useRef({});
  const thumbnailRefs = useRef({});
  const thumbnailCanvasRefs = useRef({});
  const documentScrollRef = useRef(null);

  const pdfUrl = useMemo(() => fileToObjectUrl(pdfFile), [pdfFile]);

  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setPages([]);
      setPlacementState(null);
      return undefined;
    }

    let cancelled = false;
    setStatus("Loading PDF...");
    setError("");

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setSearchHighlights({});
        setActivePage(1);
        setZoom(1);
        setStatus("");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to open this PDF. Please try another file.");
          setStatus("");
        }
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    async function buildPages() {
      const pageItems = [];
      for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: BASE_PDF_SCALE * zoom });
        pageItems.push({
          pageNumber,
          width: viewport.width,
          height: viewport.height,
          pdfWidth: page.view[2] - page.view[0],
          pdfHeight: page.view[3] - page.view[1]
        });
      }

      if (!cancelled) {
        setPages(pageItems);
      }
    }

    buildPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, zoom]);

  useEffect(() => {
    if (!signatureFile) {
      setSignatureUrl("");
      setPlacementState(null);
      return undefined;
    }
    const url = URL.createObjectURL(signatureFile);
    setSignatureUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [signatureFile]);

  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return;

    let cancelled = false;

    pages.forEach(async (item) => {
      const canvas = pageRenderRefs.current[item.pageNumber];
      if (!canvas) return;

      const page = await pdfDoc.getPage(item.pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: BASE_PDF_SCALE * zoom });
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      await page.render({ canvasContext: context, viewport }).promise;
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pages, zoom]);

  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return;

    let cancelled = false;

    pages.forEach(async (item) => {
      const canvas = thumbnailCanvasRefs.current[item.pageNumber];
      if (!canvas) return;

      const page = await pdfDoc.getPage(item.pageNumber);
      if (cancelled) return;
      const scale = THUMBNAIL_WIDTH / item.pdfWidth;
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      await page.render({ canvasContext: context, viewport }).promise;
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pages]);

  useEffect(() => {
    if (!placement || pages.length === 0) return;
    const page = pages.find((item) => item.pageNumber === placement.page);
    if (!page || page.width === placement.canvasWidth) return;

    setPlacement((currentPlacement) => {
      if (!currentPlacement || currentPlacement.page !== page.pageNumber) return currentPlacement;
      const scaleX = page.width / currentPlacement.canvasWidth;
      const scaleY = page.height / currentPlacement.canvasHeight;
      return {
        ...currentPlacement,
        x: currentPlacement.x * scaleX,
        y: currentPlacement.y * scaleY,
        width: currentPlacement.width * scaleX,
        height: currentPlacement.height * scaleY,
        canvasWidth: page.width,
        canvasHeight: page.height
      };
    });
  }, [pages, placement]);

  useEffect(() => {
    thumbnailRefs.current[activePage]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activePage]);

  useEffect(() => {
    const root = documentScrollRef.current;
    if (!root || pages.length === 0) return undefined;

    const handleScroll = () => {
      const rootRect = root.getBoundingClientRect();
      let closestPage = activePage;
      let closestDistance = Number.POSITIVE_INFINITY;

      pages.forEach((page) => {
        const node = pageRefs.current[page.pageNumber];
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.top - rootRect.top - 24);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = page.pageNumber;
        }
      });

      if (closestPage !== activePage) {
        setActivePage(closestPage);
      }
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, [activePage, pages]);

  useEffect(() => {
    if (!pdfDoc || !searchTerm.trim()) {
      setSearchHighlights({});
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      runSearch(searchTerm);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [pdfDoc, searchTerm, zoom]);

  function setPlacementState(nextPlacement) {
    setPlacement(nextPlacement);
  }

  function scrollToPage(pageNumber) {
    const page = Math.max(1, Math.min(pageNumber, pages.length || 1));
    setActivePage(page);
    pageRefs.current[page]?.scrollIntoView({ behavior: "smooth", block: "start" });
    thumbnailRefs.current[page]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function changeZoom(nextZoom) {
    const clampedZoom = Math.max(0.5, Math.min(nextZoom, 2));
    setZoom(clampedZoom);
  }

  async function runSearch(term) {
    if (!pdfDoc || !term.trim()) return;

    const needle = term.trim().toLowerCase();
    const nextHighlights = {};
    let firstMatchPage = null;

    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
      const page = await pdfDoc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: BASE_PDF_SCALE * zoom });
      const pageHighlights = [];

      textContent.items.forEach((item) => {
        const rawText = item.str || "";
        const lowerText = rawText.toLowerCase();
        if (!lowerText.includes(needle)) return;

        const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const textHeight = Math.max(Math.abs(transform[3]), 10);
        const textWidth = Math.max(item.width * viewport.scale, rawText.length * 5);
        const charWidth = textWidth / Math.max(rawText.length, 1);
        let matchIndex = lowerText.indexOf(needle);

        while (matchIndex !== -1) {
          pageHighlights.push({
            left: transform[4] + matchIndex * charWidth,
            top: transform[5] - textHeight,
            width: Math.max(needle.length * charWidth, 8),
            height: textHeight + 4
          });
          matchIndex = lowerText.indexOf(needle, matchIndex + needle.length);
        }
      });

      if (pageHighlights.length > 0) {
        nextHighlights[pageNumber] = pageHighlights;
        if (!firstMatchPage) firstMatchPage = pageNumber;
      }
    }

    setSearchHighlights(nextHighlights);
    if (firstMatchPage) {
      scrollToPage(firstMatchPage);
      setError("");
    } else {
      setError("No matching text found in this PDF.");
    }
  }

  function handlePdfUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setPdfFile(file);
    setSignatureFile(null);
    setPlacementState(null);
    setSearchTerm("");
    setSearchHighlights({});
    setError("");
    setStatus("");
    event.target.value = "";
  }

  function handleSignatureUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a signature image.");
      return;
    }
    setSignatureFile(file);
    setError("");
  }

  function moveSignature(clientX, clientY, pageNumber) {
    const pageElement = pageRefs.current[pageNumber];
    if (!pageElement || !signatureUrl) return;
    const rect = pageElement.getBoundingClientRect();
    const width = 180;
    const height = 70;
    const x = Math.max(0, Math.min(clientX - rect.left - width / 2, rect.width - width));
    const y = Math.max(0, Math.min(clientY - rect.top - height / 2, rect.height - height));
    setPlacementState({
      page: pageNumber,
      x,
      y,
      width,
      height,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    });
    setActivePage(pageNumber);
  }

  function handlePageDrop(event, pageNumber) {
    event.preventDefault();
    setDragging(false);
    moveSignature(event.clientX, event.clientY, pageNumber);
  }

  function handlePointerMove(event) {
    if (!dragging || !placement) return;
    moveSignature(event.clientX, event.clientY, placement.page);
  }

  async function signPdf() {
    if (!pdfFile || !signatureFile || !placement) {
      setError("Upload a PDF, upload a signature, then place it on the document.");
      return;
    }

    setStatus("Creating signed PDF...");
    setError("");
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("signature", signatureFile);
    formData.append("placements", JSON.stringify([placement]));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Signing failed.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `signed-${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setStatus("Signed PDF downloaded.");
    } catch (err) {
      setError(err.message || "Unable to sign the PDF.");
      setStatus("");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded text-white" style={{ backgroundColor: BRAND_COLOR }}>
            <FileSignature size={19} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-950">Sign PDF</h1>
            <p className="text-xs text-slate-500">Upload, place signature, download</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signPdf}
          disabled={!placement || Boolean(status && status !== "Signed PDF downloaded.")}
          className="inline-flex h-10 items-center gap-2 rounded bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status === "Creating signed PDF..." ? <Loader2 className="animate-spin" size={17} /> : <FileSignature size={17} />}
          Sign and Download
        </button>
      </header>

      <div className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-5">
        <div className="flex min-w-fit items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">Pages:</span>
          <button
            type="button"
            onClick={() => scrollToPage(activePage - 1)}
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
              if (Number.isFinite(value)) scrollToPage(value);
            }}
            className="h-9 w-11 rounded-full border border-slate-200 text-center font-semibold text-slate-700 outline-none focus:border-emerald-500 disabled:bg-slate-50"
          />
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100"
            title="Page options"
          >
            <ChevronDown size={16} />
          </button>
          <span>of {pages.length || 0}</span>
          <button
            type="button"
            onClick={() => scrollToPage(activePage + 1)}
            disabled={!pdfFile || activePage >= pages.length}
            className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            title="Next page"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="relative min-w-0 flex-[0_1_620px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              if (!event.target.value.trim()) {
                setSearchHighlights({});
              }
            }}
            disabled={!pdfFile}
            placeholder={`Search in ${pdfFile?.name || "document"}`}
            className="h-11 w-full rounded border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
          />
          <button
            type="button"
            onClick={() => runSearch(searchTerm)}
            disabled={!pdfFile || !searchTerm.trim()}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-40"
            title="Search"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex min-w-fit items-center gap-2">
          <button
            type="button"
            onClick={() => changeZoom(zoom - 0.1)}
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
            onClick={() => changeZoom(zoom + 0.1)}
            disabled={!pdfFile || zoom >= 2}
            className="grid h-9 w-9 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <section className="grid h-[calc(100vh-7.5rem)] grid-cols-[220px_minmax(0,1fr)_260px] overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white px-3 pb-3 pt-4">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Pages Overview</h2>
            <span className="text-xs text-slate-500">{pages.length || 0}</span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
                    scrollToPage(page.pageNumber);
                  }}
                  className={`w-full rounded border p-2 text-left transition ${
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

        <section ref={documentScrollRef} className="overflow-y-auto bg-slate-100 p-6">
          {!pdfFile ? (
            <label className="mx-auto mt-16 flex max-w-2xl cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-panel transition hover:border-emerald-500">
              <Upload className="mb-4 text-slate-500" size={34} />
              <span className="text-lg font-semibold text-slate-900">Upload your PDF</span>
              <span className="mt-2 max-w-md text-sm text-slate-500">Choose a document to open the signing workspace.</span>
              <input className="hidden" type="file" accept="application/pdf" onChange={handlePdfUpload} />
            </label>
          ) : (
            <div className="mx-auto flex w-fit flex-col gap-6">
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
                          setPlacementState(null);
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

        <aside className="border-l border-slate-200 bg-white p-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Signature</h2>
            {signatureFile ? (
              <button
                type="button"
                onClick={() => setSignatureFile(null)}
                className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100"
                title="Remove signature"
              >
                <X size={17} />
              </button>
            ) : null}
          </div>

          <label className="mb-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50">
            <FileText size={16} />
            Upload new PDF
            <input className="hidden" type="file" accept="application/pdf" onChange={handlePdfUpload} />
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-slate-300 px-4 py-7 text-center transition hover:border-emerald-500">
            <Upload className="mb-3 text-slate-500" size={28} />
            <span className="text-sm font-semibold text-slate-900">Upload signature</span>
            <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP</span>
            <input className="hidden" type="file" accept="image/*" onChange={handleSignatureUpload} />
          </label>

          {signatureUrl ? (
            <div className="mt-5">
              <div
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", "signature");
                  setDragging(true);
                }}
                onDragEnd={() => {
                  setDragging(false);
                }}
                className="flex h-24 cursor-grab items-center justify-center rounded border border-slate-200 bg-slate-50 p-3 active:cursor-grabbing"
              >
                <img src={signatureUrl} alt="Uploaded signature" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="mt-4 flex items-start gap-2 rounded bg-slate-50 p-3 text-xs text-slate-600">
                <MousePointer2 className="mt-0.5 shrink-0" size={15} />
                <span>Drag the signature onto any PDF page, then press Sign and Download.</span>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-2 text-sm">
            {placement ? (
              <div className="rounded bg-emerald-50 p-3 text-emerald-800">
                Placed on page {placement.page}
              </div>
            ) : null}
            {status ? <div className="rounded bg-slate-50 p-3 text-slate-700">{status}</div> : null}
            {error ? <div className="rounded bg-red-50 p-3 text-red-700">{error}</div> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}

function EmptyPanel({ icon, label }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded bg-slate-50 p-4 text-center text-sm text-slate-500">
      <div className="mb-2 text-slate-400">{icon}</div>
      {label}
    </div>
  );
}

export default App;
