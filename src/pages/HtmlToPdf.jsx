import { useState } from 'react';
import { convertUrlToPdf } from '../utils/conversionUtils';
import { Globe, Download, AlertTriangle, ArrowRight, Link as LinkIcon } from 'lucide-react';

const HtmlToPdf = () => {
    const [url, setUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState({
        format: 'a4',
        orientation: 'portrait',
        margin: 10
    });

    const handleConvert = async (e) => {
        e.preventDefault();
        if (!url) return;

        // Basic validation
        if (!url.startsWith('http')) {
            setError('Please enter a valid URL starting with http:// or https://');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setDownloadUrl(null);

        try {
            const pdfBlob = await convertUrlToPdf(url, settings);
            const downloadLink = URL.createObjectURL(pdfBlob);
            setDownloadUrl(downloadLink);
        } catch (err) {
            console.error(err);
            setError('Failed to convert URL. The website might be blocking access or is too complex for this tool.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Globe className="h-8 w-8 text-blue-600" />
                        HTML to PDF
                    </h1>
                    <p className="text-gray-600">
                        Convert webpages to PDF documents by simply entering the URL.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleConvert} className="space-y-6">
                        <div>
                            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Webpage URL
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    id="url-input"
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                                    placeholder="https://www.example.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Page Size</label>
                                    <select
                                        value={settings.format}
                                        onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="a4">A4</option>
                                        <option value="letter">Letter</option>
                                        <option value="legal">Legal</option>
                                        <option value="a3">A3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Orientation</label>
                                    <select
                                        value={settings.orientation}
                                        onChange={(e) => setSettings({ ...settings, orientation: e.target.value })}
                                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Margin (mm)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={settings.margin}
                                        onChange={(e) => setSettings({ ...settings, margin: e.target.value })}
                                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            {downloadUrl ? (
                                <div className="text-center space-y-4">
                                    <p className="text-green-600 font-medium flex items-center gap-2 justify-center">
                                        <Globe className="h-5 w-5" />
                                        Conversion Successful!
                                    </p>
                                    <a
                                        href={downloadUrl}
                                        download="converted_webpage.pdf"
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Download className="h-5 w-5" />
                                        Download PDF
                                    </a>
                                    <button
                                        onClick={() => { setDownloadUrl(null); }}
                                        type="button"
                                        className="block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium mx-auto"
                                    >
                                        Convert another URL
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? 'Converting...' : 'Convert to PDF'}
                                    {!isProcessing && <ArrowRight className="h-5 w-5" />}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mt-8 bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                        <p className="font-semibold mb-1">Note:</p>
                        <p>This tool fetches the public HTML of the webpage. Content behind logins or highly dynamic JavaScript-rendered content might not appear exactly as seen in your browser.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HtmlToPdf;
