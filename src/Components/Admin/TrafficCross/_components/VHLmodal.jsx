import React, { useState, useEffect } from "react";
import { useVHLStore } from "../../../../store/linseStore";

export default function VHLModal() {
  const { setVlines, setHlines} = useVHLStore((s)=> s.actions);

  const [isOpen, setIsOpen] = useState(true); // sahifa yuklanganda avtomatik ochiladi
  const [vlines, setVLinesLocal] = useState(2);
  const [hlines, setHLinesLocal] = useState(2);
  const [errors, setErrors] = useState({ v: "", h: "" });

  const clamp = (n) => Math.max(1, Math.min(4, n));

  const handleVChange = (raw) => {
    if (raw === "") return setVLinesLocal("");
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(parsed);
    setVLinesLocal(clamped);
  };

  const handleHChange = (raw) => {
    if (raw === "") return setHLinesLocal("");
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(parsed);
    setHLinesLocal(clamped);
  };

  const isValid = () => {
    const vOk = Number.isInteger(vlines) && vlines >= 1 && vlines <= 4;
    const hOk = Number.isInteger(hlines) && hlines >= 1 && hlines <= 4;
    return vOk && hOk;
  };

  const handleSave = () => {
    if (!isValid()) return;
    setVlines(vlines);
    setHlines(hlines);
    setIsOpen(false); // saqlangach auto yopiladi
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Vlines va Hlines sozlamasi</h3>

        <label className="block mb-3">
          <div className="text-sm mb-1">Vertical lines (vlines)</div>
          <input
            type="number"
            step={1}
            min={1}
            max={4}
            value={vlines}
            onChange={(e) => handleVChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="block mb-4">
          <div className="text-sm mb-1">Horizontal lines (hlines)</div>
          <input
            type="number"
            step={1}
            min={1}
            max={4}
            value={hlines}
            onChange={(e) => handleHChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={!isValid()}
            className={`rounded-md px-4 py-2 text-white ${isValid() ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
            type="button"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
