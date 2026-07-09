import { useEffect, useRef } from "react";
import { BASE_PDF_SCALE, THUMBNAIL_WIDTH } from "../constants";
import { cancelRenderTask, getCanvasPixelRatio } from "../utils/pdf";

async function renderPageToCanvas({ canvas, page, viewport, tasksRef, pageNumber, errorMessage }) {
  const context = canvas.getContext("2d");
  const outputScale = getCanvasPixelRatio();
  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

  cancelRenderTask(tasksRef, pageNumber);
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const renderTask = page.render({ canvasContext: context, viewport, transform });
  tasksRef.current[pageNumber] = renderTask;

  try {
    await renderTask.promise;
  } catch (err) {
    if (err?.name !== "RenderingCancelledException") {
      console.error(errorMessage, err);
    }
  } finally {
    if (tasksRef.current[pageNumber] === renderTask) {
      delete tasksRef.current[pageNumber];
    }
  }
}

export function usePdfRendering({ pdfDoc, pages, zoom, pageRenderRefs, renderKey, thumbnailCanvasRefs }) {
  const pageRenderTasks = useRef({});
  const thumbnailRenderTasks = useRef({});

  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return undefined;

    let cancelled = false;

    pages.forEach(async (item) => {
      const canvas = pageRenderRefs.current[item.pageNumber];
      if (!canvas) return;

      const page = await pdfDoc.getPage(item.pageNumber);
      if (cancelled) return;

      await renderPageToCanvas({
        canvas,
        page,
        viewport: page.getViewport({ scale: BASE_PDF_SCALE * zoom }),
        tasksRef: pageRenderTasks,
        pageNumber: item.pageNumber,
        errorMessage: "Unable to render PDF page"
      });
    });

    return () => {
      cancelled = true;
      Object.keys(pageRenderTasks.current).forEach((pageNumber) => {
        cancelRenderTask(pageRenderTasks, pageNumber);
      });
    };
  }, [pageRenderRefs, pages, pdfDoc, renderKey, zoom]);

  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return undefined;

    let cancelled = false;

    pages.forEach(async (item) => {
      const canvas = thumbnailCanvasRefs.current[item.pageNumber];
      if (!canvas) return;

      const page = await pdfDoc.getPage(item.pageNumber);
      if (cancelled) return;

      await renderPageToCanvas({
        canvas,
        page,
        viewport: page.getViewport({ scale: THUMBNAIL_WIDTH / item.pdfWidth }),
        tasksRef: thumbnailRenderTasks,
        pageNumber: item.pageNumber,
        errorMessage: "Unable to render PDF thumbnail"
      });
    });

    return () => {
      cancelled = true;
      Object.keys(thumbnailRenderTasks.current).forEach((pageNumber) => {
        cancelRenderTask(thumbnailRenderTasks, pageNumber);
      });
    };
  }, [pages, pdfDoc, renderKey, thumbnailCanvasRefs]);
}
