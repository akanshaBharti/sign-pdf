import React from "react";
import { FileText, MousePointer2, Upload, X } from "lucide-react";

export function SignaturePanel({
  className = "border-t border-slate-200 bg-white p-4 lg:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0",
  error,
  handlePdfUpload,
  handleSignatureUpload,
  onClose,
  pdfFile,
  placement,
  setDragging,
  setSignatureFile,
  signatureFile,
  signatureUrl,
  status
}) {
  const currentStep = placement ? 3 : signatureUrl ? 2 : pdfFile ? 2 : 1;

  return (
    <aside className={`signature-panel ${className}`}>
      <div className="workflow-head">
        <span className="step-badge">Step {currentStep} of 3</span>
        <div className="workflow-progress" aria-label="Signing progress">
          {[[1, "Upload"], [2, "Signature"], [3, "Download"]].map(([step, label]) => (
            <div key={step} className={`workflow-step ${step < currentStep ? "is-complete" : ""} ${step === currentStep ? "is-current" : ""}`}>
              <span className="step-dot">{step < currentStep ? "✓" : step}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="signature-title text-sm font-semibold text-slate-800">Signature</h2>
          <p className="signature-copy">Place your signature on the document, then continue to download.</p>
        </div>
        <div className="flex items-center gap-2">
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
          {onClose ? (
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100" title="Close panel">
              <X size={17} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <label className="upload-pdf-button flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50">
          <FileText size={16} />
          Upload new PDF
          <input className="hidden" type="file" accept="application/pdf" onChange={handlePdfUpload} />
        </label>

        <label className="signature-upload-drop flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-slate-300 px-4 py-7 text-center transition hover:border-emerald-500">
          <Upload className="mb-3 signature-upload-icon text-slate-500" size={28} />
          <span className="text-sm font-semibold text-slate-900">Upload signature</span>
          <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP</span>
          <input className="hidden" type="file" accept="image/*" onChange={handleSignatureUpload} />
        </label>
      </div>

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
            className="signature-preview flex h-24 cursor-grab items-center justify-center rounded border border-slate-200 bg-slate-50 p-3 active:cursor-grabbing"
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
        {placement ? <div className="placement-status rounded bg-emerald-50 p-3 text-emerald-800">Placed on page {placement.page}</div> : null}
        {status ? <div className="rounded bg-slate-50 p-3 text-slate-700">{status}</div> : null}
        {error ? <div className="rounded bg-red-50 p-3 text-red-700">{error}</div> : null}
      </div>
    </aside>
  );
}
