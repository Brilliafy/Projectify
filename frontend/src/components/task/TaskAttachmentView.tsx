import { useState } from 'react';
import { Download, FileText, Eye } from 'lucide-react';
import type { Attachment } from '../../types';

interface AttachmentProps {
  url: string;
  alt: string;
}

export function PdfAttachment({ url, alt }: AttachmentProps) {
  const [view, setView] = useState(false);
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  if (!view) {
    return (
      <div
        onClick={() => setView(true)}
        className="w-48 h-32 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition relative overflow-hidden group border border-base-300 flex flex-col items-center justify-center gap-2"
      >
        <div className="text-error p-3 bg-white rounded-full shadow-sm">
          <FileText size={24} />
        </div>
        <span className="text-xs font-medium truncate max-w-[90%] px-2">PDF Document</span>

        <div className="absolute inset-0 bg-black/5 hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded shadow text-base-content">
            Click to Preview
          </span>
        </div>
        <button
          onClick={handleDownload}
          className="absolute top-1 right-1 btn btn-xs btn-circle btn-ghost bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-100 dark:bg-slate-900 opacity-0 group-hover:opacity-100 transition shadow-sm"
          title="Download"
        >
          <Download size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full relative group my-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold opacity-70 flex items-center gap-2">
          <Eye size={14} /> PDF Preview
        </span>
        <button onClick={() => setView(false)} className="btn btn-xs btn-ghost">
          Close Preview
        </button>
      </div>
      <iframe src={url} className="w-full h-[500px] rounded-lg border border-base-300 bg-base-200" title={alt} />
      <div className="absolute top-10 right-4">
        <button
          onClick={handleDownload}
          className="btn btn-sm btn-circle bg-slate-100 dark:bg-slate-900 shadow-md hover:bg-base-200"
          title="Download Original"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}

export function ImageAttachment({ url, alt }: AttachmentProps) {
  const [view, setView] = useState(false);
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  if (!view) {
    return (
      <div
        onClick={() => setView(true)}
        className="w-48 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer transition-all relative overflow-hidden group border border-base-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/50"
      >
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Click to view</span>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 btn btn-xs btn-circle bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
        >
          <Download size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group w-full my-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-end mb-2 items-center gap-2">
        <button
          onClick={handleDownload}
          className="btn btn-xs btn-ghost gap-2 opacity-50 hover:opacity-100 font-bold uppercase tracking-widest text-[9px]"
        >
          <Download size={14} /> Download Original
        </button>
        <button
          onClick={() => setView(false)}
          className="btn btn-xs btn-ghost gap-2 opacity-50 hover:opacity-100 font-bold uppercase tracking-widest text-[9px]"
        >
          <Eye size={14} /> Close Preview
        </button>
      </div>
      <div className="rounded-3xl overflow-hidden border border-base-200 dark:border-slate-800 shadow-2xl bg-slate-50 dark:bg-slate-950 flex justify-center">
        <img src={url} alt={alt} className="max-w-full max-h-[700px] w-auto" />
      </div>
    </div>
  );
}

export function FileAttachment({ file }: { file: Attachment }) {
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const url = file.url || '';

  if (isImage && url) return <ImageAttachment url={url} alt={file.originalName} />;
  if (isPdf && url) return <PdfAttachment url={url} alt={file.originalName} />;

  return (
    <div className="flex items-center gap-3 p-3 border border-base-300 rounded-lg bg-slate-100 dark:bg-slate-900 max-w-sm hover:bg-base-50 transition">
      <div className="w-10 h-10 rounded bg-base-200 flex items-center justify-center shrink-0 text-base-content/50">
        <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{file.originalName}</div>
        <div className="text-xs opacity-60">{(file.size / 1024).toFixed(1)} KB</div>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
          <Download size={16} />
        </a>
      )}
    </div>
  );
}
