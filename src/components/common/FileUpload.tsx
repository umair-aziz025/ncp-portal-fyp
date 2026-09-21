import { useRef, useState } from 'react';
import { Upload, X, FileImage } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  error?: string;
  helperText?: string;
  preview?: boolean;
}

export const FileUpload = ({
  label,
  accept,
  onChange,
  error,
  helperText,
  preview = false,
}: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (file && preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    onChange(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {!selectedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              error
                ? 'border-red-500 hover:border-red-600'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }
            bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {helperText || 'Max file size: 10MB'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-contain rounded"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileImage className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
