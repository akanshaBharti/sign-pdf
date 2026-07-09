import React from "react";

export function MobileDrawer({ children, open, side, onClose }) {
  if (!open) return null;

  const sideClass = side === "left" ? "left-0 rounded-r" : "right-0 rounded-l";
  const translateClass = side === "left" ? "animate-[slideInLeft_180ms_ease-out]" : "animate-[slideInRight_180ms_ease-out]";

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" className="absolute inset-0 bg-slate-950/40" aria-label="Close panel" onClick={onClose} />
      <div className={`absolute bottom-0 top-0 ${sideClass} ${translateClass} flex w-[min(88vw,22rem)] flex-col bg-white shadow-2xl`}>
        {children}
      </div>
    </div>
  );
}
