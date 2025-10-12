import React, { useEffect } from "react";
import ReactDOM from "react-dom";

export default function ModalWrapper({ open, onClose, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-lg p-6 max-w-5xl w-[95%] max-h-[90vh] overflow-y-auto"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
