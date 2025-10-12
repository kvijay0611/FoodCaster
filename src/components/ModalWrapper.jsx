// src/components/ModalWrapper.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * Simple, robust modal wrapper — locks scroll when open and cleans up on unmount.
 */
export default function ModalWrapper({ open, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  if (!open) return null;

  // create portal container
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }

  return ReactDOM.createPortal(
    <div data-modal-root>
      <div
        data-modal-backdrop
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 9998,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "6%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          width: "min(1100px, 96%)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ background: "white", borderRadius: 12, padding: 20 }}>{children}</div>
      </div>
    </div>,
    root
  );
}
