import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#131313] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            id="login-modal"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                Join Vibelly
              </h2>
              <p className="text-zinc-400 text-sm">
                Connect with the world. Sign in or create an account.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={import.meta.env.PROD ? 'https://vibes-api.duckdns.org/api/oauth/google' : 'http://localhost:5000/api/oauth/google'}
                className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 transition-colors py-3.5 rounded-xl font-medium cursor-pointer"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </a>

              <a
                href={import.meta.env.PROD ? 'https://vibes-api.duckdns.org/api/oauth/github' : 'http://localhost:5000/api/oauth/github'}
                className="w-full flex items-center justify-center gap-3 bg-[#24292F] text-white hover:bg-[#1b1f23] transition-colors py-3.5 rounded-xl font-medium border border-white/10 cursor-pointer"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="Github" className="w-5 h-5 invert" />
                Continue with GitHub
              </a>
            </div>

            <p className="text-center text-xs text-zinc-500 mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
