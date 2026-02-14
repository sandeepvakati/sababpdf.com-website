import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import PDFPreviewWithWatermark from '../components/PDFPreviewWithWatermark';
import { addWatermark } from '../utils/conversionUtils';
import {
    Stamp, Download, File, Trash2,
    Type, Layout, Droplet,
    AlignLeft, AlignCenter, AlignRight,
    ArrowUp, ArrowDown, RotateCw, Grid, Image as ImageIcon
} from 'lucide-react';

const AddWatermark = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    // Watermark type: 'text' or 'image'
    const [watermarkType, setWatermarkType] = useState('text');
    const [watermarkImage, setWatermarkImage] = useState(null);

    // State for options
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [options, setOptions] = useState({
        fontSize: 50,
        color: '#FF0000',
        opacity: 0.5,
        rotation: 45,
        position: 'center', // 'top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'
        isMosaic: false
    });

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
    };

    const updateOption = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleConvert = async () => {
        // Validation
        if (!file) return;
        if (watermarkType === 'text' && !watermarkText) {
            alert('Please enter watermark text.');
            return;
        }
        if (watermarkType === 'image' && !watermarkImage) {
            alert('Please upload a watermark image.');
            return;
        }

        setIsProcessing(true);
        try {
            const pdfBlob = await addWatermark(file, watermarkText, {
                ...options,
                watermarkType,
                watermarkImage
            });
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error adding watermark:', error);
            alert('Failed to add watermark: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Grid Position Component
    const PositionGrid = () => {
        const positions = [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'center', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
        ];

        return (
            <div className="grid grid-cols-3 gap-2 w-24 h-24">
                {positions.map(pos => (
                    <button
                        key={pos}
                        onClick={() => updateOption('position', pos)}
                        className={`border rounded ${options.position === pos ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                        title={pos.replace('-', ' ')}
                    >
                        <div className={`w-2 h-2 rounded-full mx-auto ${options.position === pos ? 'bg-white' : 'bg-gray-300'}`} />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Stamp className="h-8 w-8 text-purple-600" />
                        Add Watermark
                    </h1>
                    <p className="text-gray-600">
                        Stamp your PDF with a customized text watermark.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left: Preview & File Info */}
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-purple-100 p-2 rounded">
                                            <File className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>


                                <div className="flex-1 rounded-xl min-h-[600px] border-2 border-gray-300 overflow-hidden">
                                    <PDFPreviewWithWatermark
                                        file={file}
                                        watermarkText={watermarkText}
                                        watermarkType={watermarkType}
                                        watermarkImage={watermarkImage}
                                        options={options}
                                    />
                                </div>
                            </div>

                            {/* Right: Settings */}
                            <div className="w-full lg:w-96 bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                                {/* Watermark Type Selector */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Watermark options</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setWatermarkType('text')}
                                            className={`relative p-4 rounded-lg border-2 transition-all ${watermarkType === 'text'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                                }`}
                                        >
                                            {watermarkType === 'text' && (
                                                <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            <Type className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                                            <p className="text-sm font-medium text-gray-700">Place text</p>
                                        </button>

                                        <button
                                            onClick={() => setWatermarkType('image')}
                                            className={`relative p-4 rounded-lg border-2 transition-all ${watermarkType === 'image'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                                }`}
                                        >
                                            {watermarkType === 'image' && (
                                                <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-700">Place image</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Text Watermark Settings */}
                                {watermarkType === 'text' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Type className="h-4 w-4" /> Text
                                            </label>
                                            <input
                                                type="text"
                                                value={watermarkText}
                                                onChange={(e) => setWatermarkText(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    /* Image Watermark Upload */
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" /> Upload Image
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const imageFile = e.target.files[0];
                                                if (imageFile) {
                                                    setWatermarkImage(imageFile);
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                        />
                                        {watermarkImage && (
                                            <p className="text-xs text-gray-500 mt-2">Selected: {watermarkImage.name}</p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={options.color}
                                                onChange={(e) => updateOption('color', e.target.value)}
                                                className="h-9 w-full rounded border border-gray-300 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                                        <input
                                            type="number"
                                            value={options.fontSize}
                                            onChange={(e) => updateOption('fontSize', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-2">
                                        <Droplet className="h-4 w-4" /> Opacity
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={options.opacity}
                                        onChange={(e) => updateOption('opacity', e.target.value)}
                                        className="w-full"
                                    />
                                    <div className="text-right text-xs text-gray-500">{Math.round(options.opacity * 100)}%</div>
                                </div>

                                <div className="flex gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                            <Layout className="h-4 w-4" /> Position
                                        </label>
                                        <PositionGrid />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-2">
                                                <RotateCw className="h-4 w-4" /> Rotation
                                            </label>
                                            <select
                                                value={options.rotation}
                                                onChange={(e) => updateOption('rotation', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            >
                                                <option value="0">No Rotation</option>
                                                <option value="45">45 Degrees</option>
                                                <option value="90">90 Degrees</option>
                                                <option value="-45">-45 Degrees</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="mosaic"
                                                checked={options.isMosaic}
                                                onChange={(e) => updateOption('isMosaic', e.target.checked)}
                                                className="rounded text-purple-600 focus:ring-purple-500"
                                            />
                                            <label htmlFor="mosaic" className="text-sm text-gray-700 font-medium cursor-pointer flex items-center gap-1">
                                                <Grid className="h-3 w-3" /> Mosaic
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    {downloadUrl ? (
                                        <a
                                            href={downloadUrl}
                                            download={`watermarked_${file.name}`}
                                            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <Download className="h-5 w-5" /> Download PDF
                                            </span>
                                        </a>
                                    ) : (
                                        <button
                                            onClick={handleConvert}
                                            disabled={isProcessing || !watermarkText}
                                            className={`block w-full text-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all
                                        ${isProcessing || !watermarkText ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {isProcessing ? 'Processing...' : 'Add Watermark'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddWatermark;
