import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Smartphone, Download, Trash2, Loader2, RotateCw } from 'lucide-react';
import { convertImageToPdf } from '../utils/conversionUtils';

const ScanToPdf = () => {
    const [sessionId, setSessionId] = useState('');
    const [scannedImages, setScannedImages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingSession, setLoadingSession] = useState(true);
    const [initError, setInitError] = useState(null);

    // Initialize Session
    useEffect(() => {
        const initSession = async () => {
            const newSessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
            setSessionId(newSessionId);

            // Create session in Firestore
            try {
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Connection timed out")), 10000)
                );

                await Promise.race([
                    setDoc(doc(db, 'sessions', newSessionId), {
                        createdAt: Date.now(),
                        images: []
                    }),
                    timeout
                ]);

                setLoadingSession(false);
            } catch (error) {
                console.error("Error creating session:", error);
                setInitError(`Failed to connect: ${error.message || "Unknown error"}`);
                setLoadingSession(false);
            }
        };

        initSession();
    }, []);

    // Listen for updates
    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.images && data.images.length > 0) {
                    setIsConnected(true);
                    setScannedImages(data.images);
                } else if (!isConnected && data.connected) {
                    // Optional: Track connection status if we add "Mobile Connected" event
                    setIsConnected(true);
                }
            }
        });

        return () => unsubscribe();
    }, [sessionId]);

    const handleGeneratePdf = async () => {
        if (scannedImages.length === 0) return;

        setIsProcessing(true);
        try {
            // Convert URLs to Files/Blobs for the utility
            const imageFiles = await Promise.all(scannedImages.map(async (img) => {
                const response = await fetch(img.url);
                const blob = await response.blob();
                return new File([blob], img.name, { type: blob.type });
            }));

            const pdfBlob = await convertImageToPdf(imageFiles);
            const url = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `mobile_scan_${sessionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF from synced images.");
        } finally {
            setIsProcessing(false);
        }
    };

    const mobileUrl = `${window.location.origin}/scan-mobile/${sessionId}`;

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Scan to PDF</h1>
                    <p className="text-gray-600 text-lg">Scan documents from your smartphone to your browser</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* QR Code / Connection Panel */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center h-full">
                        {initError ? (
                            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                                <p className="font-bold mb-2">Connection Error</p>
                                <p className="text-sm">{initError}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 bg-red-100 px-4 py-2 rounded-lg text-red-700 hover:bg-red-200 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : loadingSession ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                                <p className="text-gray-500">Initializing Session...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Step 1</h2>
                                    <p className="text-gray-500">Use your smartphone's camera to scan this QR code</p>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 mb-6">
                                    <QRCodeSVG value={mobileUrl} size={200} level={"H"} />
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
                                    <Smartphone className="w-4 h-4" />
                                    <span>Session ID: {sessionId}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Scanned Images / Result Panel */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
                        <div className="mb-6 text-center md:text-left">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Step 2</h2>
                            <p className="text-gray-500">
                                {scannedImages.length === 0
                                    ? "Waiting for scans..."
                                    : `${scannedImages.length} document${scannedImages.length > 1 ? 's' : ''} scanned`}
                            </p>
                        </div>

                        {scannedImages.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-gray-300 min-h-[300px] border-2 border-dashed border-gray-100 rounded-xl">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Smartphone className="w-10 h-10 text-gray-300" />
                                </div>
                                <p>Photos taken on your phone will appear here instantly</p>
                            </div>
                        ) : (
                            <div className="flex-grow">
                                <div className="grid grid-cols-2 gap-4 mb-6 max-h-[400px] overflow-y-auto p-2">
                                    {scannedImages.map((img, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[3/4]">
                                            <img src={img.url} alt="Scan" className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                                                Page {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleGeneratePdf}
                                    disabled={isProcessing}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" /> Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanToPdf;
