import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { MAX_CANVAS_PIXEL_RATIO } from "../constants";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export { pdfjsLib };

export function fileToObjectUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

export function getCanvasPixelRatio() {
  const ratio = window.devicePixelRatio || 1;
  if (!Number.isFinite(ratio)) return 1;
  return Math.max(1, Math.min(ratio, MAX_CANVAS_PIXEL_RATIO));
}

export function cancelRenderTask(tasksRef, pageNumber) {
  const task = tasksRef.current[pageNumber];
  if (task) {
    task.cancel();
    delete tasksRef.current[pageNumber];
  }
}
