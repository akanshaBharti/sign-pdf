import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { DocumentViewer } from "./components/DocumentViewer";
import { MobileDrawer } from "./components/MobileDrawer";
import { MobilePanelFooter } from "./components/MobilePanelFooter";
import { PagesOverview } from "./components/PagesOverview";
import { SignaturePanel } from "./components/SignaturePanel";
import { Toolbar } from "./components/Toolbar";
import { API_URL, MAX_ZOOM, MIN_ZOOM } from "./constants";
import { usePdfDocument } from "./hooks/usePdfDocument";
import { usePdfRendering } from "./hooks/usePdfRendering";
import { usePdfSearch } from "./hooks/usePdfSearch";
import { useMediaQuery } from "./hooks/useMediaQuery";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [placement, setPlacement] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState(null);
  const isMobilePanelLayout = useMediaQuery("(max-width: 1023px)");

  const pageRefs = useRef({});
  const pageRenderRefs = useRef({});
  const thumbnailRefs = useRef({});
  const thumbnailCanvasRefs = useRef({});
  const documentScrollRef = useRef(null);

  const handlePdfReset = useCallback(() => {
    setPlacement(null);
  }, []);

  const handlePdfLoadStart = useCallback(() => {
    setStatus("Loading PDF...");
    setError("");
  }, []);

  const handlePdfLoadSuccess = useCallback(() => {
    setActivePage(1);
    setZoom(1);
    setStatus("");
  }, []);

  const handlePdfLoadError = useCallback(() => {
    setError("Unable to open this PDF. Please try another file.");
    setStatus("");
  }, []);

  const { pdfDoc, pages } = usePdfDocument(pdfFile, zoom, {
    onLoadStart: handlePdfLoadStart,
    onLoadSuccess: handlePdfLoadSuccess,
    onLoadError: handlePdfLoadError,
    onReset: handlePdfReset
  });

  const scrollToPage = useCallback(
    (pageNumber) => {
      const page = Math.max(1, Math.min(pageNumber, pages.length || 1));
      setActivePage(page);
      pageRefs.current[page]?.scrollIntoView({ behavior: "smooth", block: "start" });
      thumbnailRefs.current[page]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [pages.length]
  );

  const { clearSearch, runSearch, searchHighlights, searchTerm, setSearchHighlights, setSearchTerm } = usePdfSearch({
    pdfDoc,
    scrollToPage,
    setError,
    zoom
  });

  usePdfRendering({
    pdfDoc,
    pages,
    pageRenderRefs,
    renderKey: `${isMobilePanelLayout}-${mobilePanel || "closed"}`,
    thumbnailCanvasRefs,
    zoom
  });

  useEffect(() => {
    if (!isMobilePanelLayout) {
      setMobilePanel(null);
    }
  }, [isMobilePanelLayout]);

  useEffect(() => {
    if (!signatureFile) {
      setSignatureUrl("");
      setPlacement(null);
      return undefined;
    }

    const url = URL.createObjectURL(signatureFile);
    setSignatureUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [signatureFile]);

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

  function changeZoom(nextZoom) {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(nextZoom, MAX_ZOOM));
    setZoom(clampedZoom);
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
    setPlacement(null);
    clearSearch();
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

    setPlacement({
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
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-slate-100 pb-20 lg:h-screen lg:overflow-hidden lg:pb-0">
      <AppHeader placement={placement} status={status} onSign={signPdf} />

      <Toolbar
        activePage={activePage}
        pageCount={pages.length}
        pdfFile={pdfFile}
        searchTerm={searchTerm}
        zoom={zoom}
        onPageChange={scrollToPage}
        onSearch={runSearch}
        onSearchTermChange={(value) => {
          setSearchTerm(value);
          if (!value.trim()) {
            setSearchHighlights({});
          }
        }}
        onZoomChange={changeZoom}
      />

      <section className="grid flex-1 grid-cols-1 overflow-visible lg:min-h-0 lg:grid-cols-[180px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[220px_minmax(0,1fr)_260px]">
        {!isMobilePanelLayout ? (
          <PagesOverview
            activePage={activePage}
            pages={pages}
            thumbnailCanvasRefs={thumbnailCanvasRefs}
            thumbnailRefs={thumbnailRefs}
            onPageSelect={scrollToPage}
          />
        ) : null}

        <DocumentViewer
          documentScrollRef={documentScrollRef}
          handlePageDrop={handlePageDrop}
          handlePdfUpload={handlePdfUpload}
          handlePointerMove={handlePointerMove}
          pageRefs={pageRefs}
          pageRenderRefs={pageRenderRefs}
          pages={pages}
          pdfFile={pdfFile}
          placement={placement}
          searchHighlights={searchHighlights}
          setDragging={setDragging}
          setPlacement={setPlacement}
          signatureUrl={signatureUrl}
        />

        {!isMobilePanelLayout ? (
          <SignaturePanel
            error={error}
            handlePdfUpload={handlePdfUpload}
            handleSignatureUpload={handleSignatureUpload}
            placement={placement}
            setDragging={setDragging}
            setSignatureFile={setSignatureFile}
            signatureFile={signatureFile}
            signatureUrl={signatureUrl}
            status={status}
          />
        ) : null}
      </section>

      {isMobilePanelLayout ? (
        <>
          <MobilePanelFooter
            pageCount={pages.length}
            signatureReady={Boolean(signatureUrl)}
            onOpenPages={() => setMobilePanel("pages")}
            onOpenSignature={() => setMobilePanel("signature")}
          />

          <MobileDrawer open={mobilePanel === "pages"} side="left" onClose={() => setMobilePanel(null)}>
            <PagesOverview
              activePage={activePage}
              className="flex h-full min-h-0 flex-col bg-white px-3 pb-3 pt-4"
              itemClassName="w-full rounded border p-2 text-left transition"
              listClassName="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
              pages={pages}
              thumbnailCanvasRefs={thumbnailCanvasRefs}
              thumbnailRefs={thumbnailRefs}
              onClose={() => setMobilePanel(null)}
              onPageSelect={(pageNumber) => {
                scrollToPage(pageNumber);
                setMobilePanel(null);
              }}
            />
          </MobileDrawer>

          <MobileDrawer open={mobilePanel === "signature"} side="right" onClose={() => setMobilePanel(null)}>
            <SignaturePanel
              className="h-full overflow-y-auto bg-white p-4"
              error={error}
              handlePdfUpload={handlePdfUpload}
              handleSignatureUpload={handleSignatureUpload}
              onClose={() => setMobilePanel(null)}
              placement={placement}
              setDragging={setDragging}
              setSignatureFile={setSignatureFile}
              signatureFile={signatureFile}
              signatureUrl={signatureUrl}
              status={status}
            />
          </MobileDrawer>
        </>
      ) : null}
    </main>
  );
}

export default App;
