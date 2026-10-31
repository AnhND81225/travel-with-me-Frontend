import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, X } from "lucide-react";
import { validateCatalogImage } from "../../utils/tourGuideValidation";

// Mỗi preview tự thu hồi object URL khi đổi tệp hoặc bị xóa, không lưu blob URL vào API.
function ImagePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return <img src={url || undefined} alt={file.name} className="w-full h-32 object-cover" />;
}

// Thứ tự trong hàng đợi quyết định thứ tự upload; ảnh đầu tiên là bìa theo contract BE hiện tại.
export function TourImagePicker({ files, onChange, disabled, onCheckingChange, days, dayNumbers, onDayChange, uploadedCount = 0 }: {
  files: File[]; onChange: (files: File[]) => void; disabled: boolean; onCheckingChange: (checking: boolean) => void; uploadedCount?: number; days: number[]; dayNumbers: Map<File, number | null>; onDayChange: (file: File, day: number | null) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const locked = disabled || checking;

  async function choose(selected: File[]) {
    setChecking(true);
    onCheckingChange(true);
    setError("");
    try {
      const errors = await Promise.all(selected.map(async file => {
        const message = await validateCatalogImage(file);
        return message ? `${file.name}: ${message}` : "";
      }));
      if (errors.some(Boolean)) { setError(errors.filter(Boolean).join(" ")); return; }
      onChange([...files, ...selected]);
    } finally { setChecking(false); onCheckingChange(false); }
  }

  function move(index: number, target: number) {
    const next = [...files];
    const [file] = next.splice(index, 1);
    next.splice(target, 0, file);
    onChange(next);
  }

  return <section className="space-y-3 border border-[#D8D2C5] rounded-lg p-4" aria-label="Tour photos">
    <div className="flex flex-wrap justify-between items-center gap-3"><div><h3 className="text-sm font-bold">Tour photos</h3><p className="text-xs text-[#5C665F] mt-1">Choose the cover, then arrange your gallery before creating the tour.</p></div>
      <label className={`inline-flex gap-2 items-center px-3 py-2 rounded border border-[#D8D2C5] text-xs font-bold ${locked ? "opacity-50" : "cursor-pointer bg-white"}`}><ImagePlus size={16} />{checking ? "Checking images..." : "Add photos"}<input aria-label="Add tour photos" type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={locked} onChange={e => { const selected = Array.from(e.target.files ?? []); e.target.value = ""; if (selected.length) void choose(selected); }} /></label>
    </div>
    <p className="text-xs text-[#5C665F]">JPEG, PNG or WebP · Up to 5 MiB each. The cover is the large hero photo; the next two photos appear beside it. Extra photos appear in the gallery.</p>
    {!!uploadedCount && <p role="status" className="text-xs text-[#173D2C]">{uploadedCount} photo(s) already uploaded. The saved cover and photo order are fixed; the files below will be appended.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!files.length && <p className="text-xs py-3 text-[#687568]">No photos selected. You can also add photos to the draft later.</p>}
    <ol className="grid sm:grid-cols-3 gap-3">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${file.size}-${index}`} className="min-w-0 rounded-lg overflow-hidden border border-[#D8D2C5] bg-white">
      <ImagePreview file={file} /><div className="p-2 space-y-2"><span className="text-[10px] font-bold text-[#173D2C]">{index === 0 && !uploadedCount ? "COVER · LARGE HERO" : `GALLERY PHOTO ${index + uploadedCount + 1}`}</span><p className="text-xs truncate" title={file.name}>{file.name}</p><label className="block text-[11px]">Itinerary photo<select aria-label={`Itinerary day for photo ${index + 1}`} disabled={locked} className="block w-full border border-[#D8D2C5] rounded p-1 mt-1" value={dayNumbers.get(file) ?? ""} onChange={e => onDayChange(file, e.target.value ? Number(e.target.value) : null)}><option value="">Gallery only</option>{days.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label><div className="flex flex-wrap gap-2">
        {!uploadedCount && index > 0 && <button type="button" disabled={locked} className="text-[11px] inline-flex items-center gap-1" onClick={() => move(index, 0)}><Star size={13} />Set as cover</button>}
        <button type="button" disabled={locked || index === 0} aria-label={`Move photo ${index + 1} earlier`} className="disabled:opacity-30" onClick={() => move(index, index - 1)}><ArrowUp size={15} /></button>
        <button type="button" disabled={locked || index === files.length - 1} aria-label={`Move photo ${index + 1} later`} className="disabled:opacity-30" onClick={() => move(index, index + 1)}><ArrowDown size={15} /></button>
        <button type="button" disabled={locked} aria-label={`Remove photo ${index + 1}`} onClick={() => onChange(files.filter((_, i) => i !== index))}><X size={15} /></button>
      </div></div>
    </li>)}</ol>
  </section>;
}
