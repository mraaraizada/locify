import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X } from 'lucide-react'

export default function ImagePreviewModal({ isOpen, image, onSend, onCancel }) {
  if (!isOpen || !image) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col gap-6">
            {/* Title */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
                Send Pasted Image?
              </h3>
              <p className="text-sm text-[#64748B] dark:text-slate-400">
                Preview the image before sending
              </p>
            </div>

            {/* Image Preview */}
            <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-center">
              <img
                src={image.preview}
                alt="Pasted"
                className="max-w-full max-h-96 rounded-xl shadow-lg object-contain"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={onSend}
                className="flex-1 flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                <Send size={18} />
                Send Image
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
