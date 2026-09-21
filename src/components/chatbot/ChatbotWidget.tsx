import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Academic Assistant</h3>
                  <p className="text-xs text-blue-100">Ask me anything academic</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ChatWindow />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-50"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </>
  );
};
