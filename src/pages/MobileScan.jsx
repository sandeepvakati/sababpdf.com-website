import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Check, Loader2, UploadCloud } from 'lucide-react';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const MobileScan = () => {
    const { sessionId } = useParams();
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !sessionId) return;

        setUploading(true);
        setSuccess(false);

        try {
            // 1. Upload to Storage
            const storageRef = ref(storage, `scans/${sessionId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Update Firestore Session
            const sessionRef = doc(db, 'sessions', sessionId);
            await updateDoc(sessionRef, {
                images: arrayUnion({
                    url: downloadUrl,
                    name: file.name,
                    timestamp: Date.now()
                })
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error uploading scan:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                        <Camera className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Ready to Scan</h1>
                    <p className="text-gray-400">
                        Tap the button below to take a photo or select from gallery. Your image will appear on your desktop instantly.
                    </p>
                </div>

                <div className="relative">
                    {uploading ? (
                        <div className="flex flex-col items-center justify-center h-48 bg-gray-800 rounded-2xl border-2 border-gray-700 border-dashed animate-pulse">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                            <p className="text-lg font-medium">Uploading...</p>
                        </div>
                    ) : success ? (
                        <div className="flex flex-col items-center justify-center h-48 bg-green-900/20 rounded-2xl border-2 border-green-500">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-lg font-bold text-green-400">Sent to Desktop!</p>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center h-48 bg-gray-800 hover:bg-gray-700 rounded-2xl border-2 border-gray-700 border-dashed cursor-pointer transition-all active:scale-95">
                            <UploadCloud className="w-12 h-12 text-orange-500 mb-4" />
                            <span className="text-xl font-bold">Tap to Scan</span>
                            <span className="text-sm text-gray-500 mt-2">Camera or Gallery</span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    )}
                </div>

                <div className="text-xs text-gray-500">
                    Session ID: <span className="font-mono text-gray-400">{sessionId}</span>
                </div>
            </div>
        </div>
    );
};

export default MobileScan;
