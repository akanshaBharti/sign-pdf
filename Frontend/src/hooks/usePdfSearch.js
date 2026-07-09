import { useCallback, useEffect, useState } from "react";
import { BASE_PDF_SCALE } from "../constants";
import { pdfjsLib } from "../utils/pdf";

export function usePdfSearch({ pdfDoc, zoom, scrollToPage, setError }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHighlights, setSearchHighlights] = useState({});

  const runSearch = useCallback(
    async (term) => {
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
    },
    [pdfDoc, scrollToPage, setError, zoom]
  );

  useEffect(() => {
    if (!pdfDoc || !searchTerm.trim()) {
      setSearchHighlights({});
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      runSearch(searchTerm);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [pdfDoc, runSearch, searchTerm, zoom]);

  function clearSearch() {
    setSearchTerm("");
    setSearchHighlights({});
  }

  return {
    searchTerm,
    setSearchTerm,
    searchHighlights,
    setSearchHighlights,
    runSearch,
    clearSearch
  };
}
