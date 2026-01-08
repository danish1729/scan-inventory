"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm overflow-hidden bg-white rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
