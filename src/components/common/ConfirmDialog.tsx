import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getVariantStyles()}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6 ml-14">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="secondary">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
