import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, FileText } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export default function DownloadModal({ isOpen, file, onDownload, onCancel }) {
  if (!isOpen || !file) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FileText size={32} className="text-[#22C55E]" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
                File Received!
              </h3>
              <p className="text-sm text-[#64748B] dark:text-slate-400">
                Would you like to download this file?
              </p>
            </div>

            {/* File Info */}
            <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] dark:text-slate-400">File name:</span>
                  <span className="font-semibold text-[#0F172A] dark:text-white truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B] dark:text-slate-400">Size:</span>
                  <span className="font-semibold text-[#0F172A] dark:text-white">
                    {formatBytes(file.blob?.size)}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={onDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                <Download size={18} />
                Download
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
