import React, { useEffect, useState } from 'react';
import { Headphones } from 'lucide-react';

interface AudioPreviewProps {
  /** The file the lawyer selected. Never re-downloaded from storage. */
  file: File | null;
}

/**
 * Plays the recording being reviewed, straight from the browser's own copy.
 *
 * WHY FROM THE LOCAL FILE. The recording is deleted from storage the moment it
 * is transcribed — that is the whole reason the upload detour was acceptable —
 * so there is nothing to fetch back. But the browser still holds the File the
 * lawyer picked, and an object URL turns it into audio at no cost: no request,
 * no storage, no change to what the server keeps.
 *
 * It follows that playback lasts exactly as long as the tab does. That matches
 * what it is for — checking a word against what was actually said while reading
 * the transcript — and the component says so rather than letting someone
 * discover it after a reload.
 */
export const AudioPreview: React.FC<AudioPreviewProps> = ({ file }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    // Revoked on unmount: an object URL pins the whole file in memory, and a
    // two-hour hearing is not something to leak by leaving the tab open.
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Headphones className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-700">Escuchar la grabación</span>
      </div>

      <audio controls src={url} className="w-full h-9" preload="metadata" />

      <p className="text-[10.5px] text-slate-500 leading-snug">
        Se reproduce desde este navegador, no desde el servidor: la grabación se borra del
        almacenamiento al terminar de transcribirse. Estará disponible mientras no cierres esta
        pestaña.
      </p>
    </div>
  );
};
