import { useEffect, useMemo, useState } from "react";
import { BASE_PDF_SCALE } from "../constants";
import { fileToObjectUrl, pdfjsLib } from "../utils/pdf";

export function usePdfDocument(pdfFile, zoom, { onLoadStart, onLoadSuccess, onLoadError, onReset } = {}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const pdfUrl = useMemo(() => fileToObjectUrl(pdfFile), [pdfFile]);

  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setPages([]);
      onReset?.();
      return undefined;
    }

    let cancelled = false;
    onLoadStart?.();

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        onLoadSuccess?.();
      })
      .catch(() => {
        if (!cancelled) {
          onLoadError?.();
        }
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      URL.revokeObjectURL(pdfUrl);
    };
  }, [onLoadError, onLoadStart, onLoadSuccess, onReset, pdfUrl]);

  useEffect(() => {
    if (!pdfDoc) return undefined;

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

  return { pdfDoc, pages };
}
