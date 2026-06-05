import React, { useRef, useState } from 'react';
import { Upload, Loader, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdmin } from '../../contexts/AdminContext';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  /** Optional aspect ratio hint (e.g. 1 for square, 16/9, 4/3). Warning only. */
  hintAspect?: number;
  /** Minimum recommended dimension in px (default 200). */
  minDim?: number;
  /** Maximum allowed dimension in px (default 6000). Exceeded → upload rejected. */
  maxDim?: number;
  /** 지정 시 반응형 다중 해상도(WebP)를 생성·업로드하고 srcset/치수를 함께 돌려준다(이미지 위젯용). */
  onMeta?: (m: { src: string; srcSet: string; w: number; h: number }) => void;
}

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPTED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function readImageDimensions(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** 리사이즈 후 가장 긴 변 상한(px) — 웹 표시에 충분하면서 LCP를 낮춘다. */
const MAX_OUTPUT_DIM = 2000;

/** 반응형 srcset 으로 생성할 가로폭 후보(px). 원본 가로폭/상한을 넘는 값은 자동 제외(업스케일 안 함). */
const RESPONSIVE_WIDTHS = [640, 1280, 2000];

/** 캔버스로 다운스케일 + WebP 변환. 실패하면 null → 호출부에서 원본을 그대로 올린다(fail open). */
async function compressToWebp(file: File, dims: { w: number; h: number }): Promise<Blob | null> {
  try {
    const scale = Math.min(1, MAX_OUTPUT_DIM / Math.max(dims.w, dims.h));
    const tw = Math.max(1, Math.round(dims.w * scale));
    const th = Math.max(1, Math.round(dims.h * scale));
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    const cctx = canvas.getContext('2d');
    if (!cctx) { bitmap.close?.(); return null; }
    cctx.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close?.();
    return await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/webp', 0.85));
  } catch {
    return null;
  }
}

/** 이미 디코드한 비트맵을 지정 가로폭으로 다운스케일해 WebP Blob 으로 — srcset 변형 생성용(비트맵 재사용). */
async function webpFromBitmap(bitmap: ImageBitmap, natW: number, natH: number, targetW: number): Promise<Blob | null> {
  try {
    const scale = Math.min(1, targetW / natW);
    const tw = Math.max(1, Math.round(natW * scale));
    const th = Math.max(1, Math.round(natH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    const cctx = canvas.getContext('2d');
    if (!cctx) return null;
    cctx.drawImage(bitmap, 0, 0, tw, th);
    return await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/webp', 0.85));
  } catch {
    return null;
  }
}

export const ImageUploader: React.FC<Props> = ({
  value, onChange, label,
  maxSizeMB = 5,
  hintAspect,
  minDim = 200,
  maxDim = 6000,
  onMeta,
}) => {
  const { adminClubId } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleFile = async (file: File) => {
    setError(''); setWarning('');

    // 1. Format check (mime + extension fallback)
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const validMime = ACCEPTED_TYPES.has(file.type);
    const validExt = ACCEPTED_EXTS.has(ext);
    if (!validMime && !validExt) {
      setError('JPG · PNG · WebP 형식만 업로드 가능합니다.');
      return;
    }

    // 2. Size check
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`최대 ${maxSizeMB}MB까지 가능합니다. (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    // 3. Dimension check (best-effort, fails open if browser can't decode)
    const dims = await readImageDimensions(file);
    if (dims) {
      const { w, h } = dims;
      if (w < minDim || h < minDim) {
        setError(`이미지 해상도가 너무 작습니다. (${w}×${h}, 최소 ${minDim}×${minDim} 권장)`);
        return;
      }
      if (w > maxDim || h > maxDim) {
        setError(`이미지 해상도가 너무 큽니다. (${w}×${h}, 최대 ${maxDim}×${maxDim})`);
        return;
      }
      if (hintAspect) {
        const ratio = w / h;
        const drift = Math.abs(ratio - hintAspect) / hintAspect;
        if (drift > 0.2) {
          setWarning(`권장 비율과 다릅니다. (현재 ${w}:${h}, 권장 ${hintAspect.toFixed(2)}:1)`);
        }
      }
    }

    // 4. 업로드 — onMeta(이미지 위젯)면 반응형 다중 해상도(srcset), 아니면 기존 단일 업로드
    setUploading(true);
    const folder = adminClubId ?? 'shared';
    const stamp = Date.now();

    if (onMeta && dims) {
      const { w: natW, h: natH } = dims;
      // 후보 너비 중 원본폭/상한 이하만 생성(업스케일 방지) → 중복 제거 후 오름차순
      const targets = Array.from(new Set(
        RESPONSIVE_WIDTHS.map(w => Math.min(w, Math.min(natW, MAX_OUTPUT_DIM)))
      )).sort((a, b) => a - b);
      let bitmap: ImageBitmap | null = null;
      try { bitmap = await createImageBitmap(file); } catch { bitmap = null; }
      const variants: { url: string; w: number }[] = [];
      if (bitmap) {
        for (const tw of targets) {
          const blob = await webpFromBitmap(bitmap, natW, natH, tw);
          if (!blob) continue;
          const path = `${folder}/${stamp}_${tw}.webp`;
          const { error: e } = await supabase.storage.from('club-pages').upload(path, blob, { upsert: true, contentType: 'image/webp' });
          if (e) { setError(e.message); setUploading(false); bitmap.close?.(); return; }
          variants.push({ url: supabase.storage.from('club-pages').getPublicUrl(path).data.publicUrl, w: tw });
        }
        bitmap.close?.();
      }
      if (variants.length) {
        const srcSet = variants.map(v => `${v.url} ${v.w}w`).join(', ');
        const largest = variants[variants.length - 1];
        onMeta({ src: largest.url, srcSet, w: natW, h: natH });
        setUploading(false);
        return;
      }
      // 변환/디코드 실패 → 아래 단일 업로드로 폴백
    }

    // 단일 업로드 (기존 동작 / 폴백) — WebP 변환 실패 시 원본 그대로(fail open)
    let uploadBlob: Blob = file;
    let outExt = ['jpg','jpeg','png','webp'].includes(ext) ? ext : 'jpg';
    if (dims) {
      const webp = await compressToWebp(file, dims);
      if (webp && webp.size < file.size) { uploadBlob = webp; outExt = 'webp'; }
    }
    const path = `${folder}/${stamp}.${outExt}`;
    const { error: uploadErr } = await supabase.storage
      .from('club-pages')
      .upload(path, uploadBlob, { upsert: true, contentType: uploadBlob.type || undefined });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }
    const url = supabase.storage.from('club-pages').getPublicUrl(path).data.publicUrl;
    if (onMeta && dims) onMeta({ src: url, srcSet: '', w: dims.w, h: dims.h });
    else onChange(url);
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</div>
      )}
      {value ? (
        <div className="relative group/img">
          <img src={value} alt="" className="w-full h-24 object-cover rounded border border-gray-200" />
          <button
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 border-2 border-dashed border-gray-200 hover:border-orange-400 text-gray-400 hover:text-orange-500 flex flex-col items-center justify-center gap-1 rounded transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader className="w-4 h-4 animate-spin text-orange-400" />
            : <>
                <Upload className="w-4 h-4" />
                <span className="text-[10px] font-bold">클릭하여 업로드 (JPG·PNG·WebP, 최대 {maxSizeMB}MB)</span>
              </>
          }
        </button>
      )}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="또는 URL 직접 입력..."
        className="w-full border border-gray-200 rounded text-[10px] px-2 py-1.5 outline-none focus:border-orange-400 font-mono text-gray-500"
      />
      {error && <div className="text-[10px] text-red-500 font-bold">{error}</div>}
      {!error && warning && <div className="text-[10px] text-amber-600 font-bold">⚠ {warning}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
};
