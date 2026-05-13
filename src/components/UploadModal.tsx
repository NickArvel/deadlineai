'use client';

import { useState, useRef } from 'react';
import { X, FileText, Loader2, Check, Trash2, Upload } from 'lucide-react';
import { useUser, Deadline } from '@/context/UserContext';

type ModalState = 'idle' | 'analyzing' | 'review' | 'error';

type ExtractedDeadline = {
  id: string;
  subject: string;
  task: string;
  dueDate: string;
  estimatedHours?: number;
  selected: boolean;
};

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile } = useUser();
  const [state, setState] = useState<ModalState>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [summary, setSummary] = useState('');
  const [items, setItems] = useState<ExtractedDeadline[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function processFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Please upload a PDF, JPG, or PNG file.');
      setState('error');
      return;
    }

    setState('analyzing');

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, mimeType: file.type, fileName: file.name }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      setSummary(data.summary ?? '');
      setItems(
        (data.extractedDeadlines ?? []).map(
          (d: Omit<ExtractedDeadline, 'id' | 'selected'>, i: number) => ({
            ...d,
            id: `${Date.now()}-${i}`,
            selected: true,
          }),
        ),
      );
      setState('review');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to analyze file. Please try again.');
      setState('error');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function toggle(id: string) {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d)));
  }

  function update(id: string, field: 'subject' | 'task' | 'dueDate', value: string) {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  function handleConfirm() {
    if (!profile) return;
    const newDeadlines: Deadline[] = items
      .filter((d) => d.selected)
      .map(({ id, subject, task, dueDate }) => ({ id, subject, task, dueDate }));
    saveProfile({ ...profile, deadlines: [...profile.deadlines, ...newDeadlines] });
    onClose();
  }

  const selectedCount = items.filter((d) => d.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Upload Schedule</h2>
            <p className="text-xs text-gray-400 mt-0.5">Timetable, syllabus, or homework schedule · PDF, JPG, PNG</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {state === 'idle' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#534AB7] bg-[#F4F3FF]'
                  : 'border-gray-200 hover:border-[#534AB7] hover:bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#EEEDFE' }}>
                  <Upload size={26} style={{ color: '#534AB7' }} />
                </div>
              </div>
              <p className="font-semibold text-gray-700 text-sm">Drop your file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1.5">PDF, JPG, or PNG · Max 20 MB</p>
            </div>
          )}

          {state === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#EEEDFE' }}>
                <Loader2 size={28} style={{ color: '#534AB7' }} className="animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Analyzing your document…</p>
                <p className="text-xs text-gray-400 mt-1">Claude AI is extracting deadlines and subjects</p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <X size={20} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">{errorMsg}</p>
              <button
                onClick={() => setState('idle')}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90 transition-all"
                style={{ background: '#534AB7' }}
              >
                Try again
              </button>
            </div>
          )}

          {state === 'review' && (
            <div className="space-y-4">
              {summary && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: '#F4F3FF', color: '#4B44A8' }}>
                  <FileText size={15} className="shrink-0 mt-0.5" />
                  <span>{summary}</span>
                </div>
              )}

              {items.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No deadlines were found in this document.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    {items.length} deadline{items.length !== 1 ? 's' : ''} found — review and confirm
                  </p>
                  {items.map((d) => (
                    <div
                      key={d.id}
                      className={`rounded-xl border p-4 transition-all ${
                        d.selected ? 'border-[#534AB7]/30 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(d.id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            d.selected ? 'border-[#534AB7] bg-[#534AB7]' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {d.selected && <Check size={11} stroke="white" strokeWidth={3} />}
                        </button>

                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={d.subject}
                              onChange={(e) => update(d.id, 'subject', e.target.value)}
                              placeholder="Subject"
                              className="text-xs font-semibold bg-gray-100 rounded-lg px-3 py-1.5 outline-none focus:ring-2 text-gray-800 w-full"
                              style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                            />
                            <input
                              type="date"
                              value={d.dueDate}
                              onChange={(e) => update(d.id, 'dueDate', e.target.value)}
                              className="text-xs bg-gray-100 rounded-lg px-3 py-1.5 outline-none focus:ring-2 text-gray-800 w-full"
                              style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                            />
                          </div>
                          <input
                            value={d.task}
                            onChange={(e) => update(d.id, 'task', e.target.value)}
                            placeholder="Task description"
                            className="w-full text-xs bg-gray-100 rounded-lg px-3 py-1.5 outline-none focus:ring-2 text-gray-700"
                            style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                          />
                        </div>

                        <button
                          onClick={() => remove(d.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {state === 'review' && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {selectedCount} deadline{selectedCount !== 1 ? 's' : ''} will be added
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40"
                style={{ background: '#534AB7' }}
              >
                Add {selectedCount > 0 ? `${selectedCount} ` : ''}Deadline{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
