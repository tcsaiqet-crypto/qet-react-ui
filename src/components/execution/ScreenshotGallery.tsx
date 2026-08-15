import React, { useState } from 'react';
import { ScreenshotEvidence } from '../../types';

interface ScreenshotGalleryProps {
  screenshots: ScreenshotEvidence[];
  runId: string;
}

export const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({ screenshots, runId }) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotEvidence | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'FAILURES'>('ALL');

  const filteredScreenshots = screenshots.filter((s) => {
    if (filter === 'POSITIVE') return s.case_type === 'Positive' && !s.is_failure;
    if (filter === 'NEGATIVE') return s.case_type === 'Negative' || s.is_failure;
    if (filter === 'FAILURES') return s.is_failure;
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col gap-4">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Test Case Screenshot Evidence (Positive & Negative Cases)
            <span className="text-xs font-normal text-slate-400 ml-1">
              ({screenshots.length} captured images)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-page screenshots captured automatically during headed browser execution for every test scenario.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'POSITIVE', 'NEGATIVE', 'FAILURES'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                filter === f
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Images' : f === 'POSITIVE' ? 'Positive (Happy Path)' : f === 'NEGATIVE' ? 'Negative Cases' : 'Failures'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredScreenshots.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <svg className="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-slate-400 text-sm font-semibold">No screenshots captured yet</div>
          <div className="text-slate-500 text-xs mt-1">
            Run test cases in Playwright to automatically record full-page screenshot evidence.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScreenshots.map((shot, idx) => {
            const isNegativeOrFailure = shot.is_failure || shot.case_type === 'Negative';
            return (
              <div
                key={`${shot.filename}-${idx}`}
                onClick={() => setSelectedScreenshot(shot)}
                className="group relative bg-slate-950/70 border border-slate-800 hover:border-slate-600 rounded-xl overflow-hidden shadow transition cursor-pointer flex flex-col"
              >
                {/* Image Preview */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                  <img
                    src={shot.url}
                    alt={shot.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      // Fallback SVG display
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold shadow">
                      🔍 Click to Zoom
                    </span>
                  </div>

                  {/* Badge top-left */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-900/90 text-white border border-slate-700">
                      {shot.test_case_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        shot.case_type === 'Positive'
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950/90 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {shot.case_type}
                    </span>
                  </div>

                  {/* Badge top-right */}
                  <div className="absolute top-2 right-2">
                    {shot.is_failure ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-950/90 text-rose-400 border border-rose-700">
                        Defect Captured
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-700">
                        Passed
                      </span>
                    )}
                  </div>
                </div>

                {/* Caption & Timestamp */}
                <div className="p-3 flex flex-col gap-1 flex-1 justify-between">
                  <div className="text-xs font-medium text-slate-200 line-clamp-2">
                    {shot.caption}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800/60">
                    <span>{shot.filename}</span>
                    <span>{shot.timestamp ? new Date(shot.timestamp).toLocaleTimeString() : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white">
                  {selectedScreenshot.test_case_id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-950 text-blue-300 border border-blue-700">
                  {selectedScreenshot.case_type} Scenario
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  {selectedScreenshot.caption}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedScreenshot.url}
                  download={selectedScreenshot.filename}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Image
                </a>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 bg-slate-950/80 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={selectedScreenshot.url}
                alt={selectedScreenshot.caption}
                className="max-w-full max-h-[65vh] object-contain rounded-lg border border-slate-800 shadow"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">File: {selectedScreenshot.filename}</span>
              <span>Captured: {selectedScreenshot.timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
