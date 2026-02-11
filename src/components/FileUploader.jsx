import { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

const FileUploader = ({ onFilesSelected, multiple = true, accept = '.pdf' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            // Filter for accepted types if needed, simple implementation for now
            onFilesSelected(files);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            onFilesSelected(files);
            // Reset input value to allow selecting the same file again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple={multiple}
                accept={accept}
                onChange={handleChange}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-red-100 p-4 rounded-full">
                    <UploadCloud className="h-10 w-10 text-red-500" />
                </div>
                <div>
                    <span className="text-xl font-semibold text-gray-700 block mb-1">
                        Select PDF files
                    </span>
                    <span className="text-gray-500 text-sm">
                        or drop PDFs here
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FileUploader;
