import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function RightPanel({ isOpen, onClose, children }: RightPanelProps): React.JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return <></>;

  return (
    <div className="right-panel-overlay" onClick={onClose}>
      <div
        className="right-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="right-panel-header">
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="right-panel-content">{children}</div>
      </div>
    </div>
  );
}
