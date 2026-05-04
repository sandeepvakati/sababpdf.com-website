'use client';

import { useState } from 'react';
import UnifiedDropzone from './UnifiedDropzone';

export default function UnlockPdfILovePDF() {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [unlockedBlob, setUnlockedBlob] = useState(null);

    const handleFiles = (files) => {
        if (files && files.length > 0) {
            setFile(files[0]);
            setError(null);
            setSuccess(false);
            setUnlockedBlob(null);
            setPassword('');
            setRequiresPassword(false);
        }
    };

    const handleUnlock = async () => {
        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        if (requiresPassword && !password) {
            setError('This file requires an open password. Please enter it below.');
            return;
        }

        setProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (password && password.trim()) {
                formData.append('password', password.trim());
            }

            const response = await fetch('/api/unlock-pdf', {
                method: 'POST',
                body: formData,
            });

            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
                const errMsg = data.error || '';

                // Detect password-required errors from message or status
                const needsPassword =
                    errMsg.toLowerCase().includes('password') ||
                    errMsg.toLowerCase().includes('encrypted') ||
                    response.status === 500;

                if (!password && needsPassword) {
                    setRequiresPassword(true);
                    throw new Error('This PDF is password-protected. Please enter the password to unlock it.');
                }

                if (password && (errMsg.toLowerCase().includes('incorrect') || errMsg.toLowerCase().includes('wrong'))) {
                    throw new Error('The password you entered is incorrect. Please try again.');
                }

                throw new Error(errMsg || 'Failed to unlock PDF');
            }

            // Check if response is actually a PDF
            if (contentType && contentType.includes('application/pdf')) {
                const blob = await response.blob();
                setUnlockedBlob(blob);
                setSuccess(true);
            } else {
                throw new Error('Server returned an invalid response');
            }
        } catch (err) {
            console.error('Unlock error:', err);
            setError(err.message || 'Failed to unlock PDF. Ensure the password is correct.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!unlockedBlob || !file) return;
        const url = window.URL.createObjectURL(unlockedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `unlocked_${file.name}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    };

    const reset = () => {
        setFile(null);
        setPassword('');
        setRequiresPassword(false);
        setError(null);
        setSuccess(false);
        setUnlockedBlob(null);
    };

    /* ═══ RESULTS ═══ */
    if (success && unlockedBlob) {
        return (
            <>
                <style>{css}</style>
                <div className="ptj-root">
                    <div className="ptj-done-bar">
                        <span className="ptj-done-icon">✅</span>
                        <div>
                            <strong>PDF Unlocked Successfully!</strong>
                            <p>Your PDF has been unlocked and is ready for download.</p>
                        </div>
                    </div>

                    <div className="ptj-actions-top">
                        <button className="ptj-btn ptj-primary ptj-btn-big" onClick={handleDownload} style={{ maxWidth: '400px', margin: '0 auto' }}>
                            ⬇ Download Unlocked PDF
                        </button>
                    </div>

                    <div className="ptj-actions-top mt-4">
                        <button className="ptj-btn ptj-outline" onClick={reset}>↻ Unlock Another PDF</button>
                    </div>
                </div>
            </>
        );
    }

    /* ═══ UPLOAD / PROCESSING ═══ */
    return (
        <div className="ptj-root">
            {!file && (
                <div className="flex justify-center w-full max-w-4xl mx-auto">
                     <UnifiedDropzone
                        onFiles={handleFiles}
                        accept=".pdf"
                        multiple={false}
                        label="Select PDF file"
                        description="or drop PDF here"
                        accentColor="#e74c3c"
                    />
                </div>
            )}

            {file && !processing && !success && (
                <div className="ptj-file-ready max-w-2xl mx-auto w-full">
                    <div className="ptj-file-info w-full">
                        <span className="ptj-file-icon">📄</span>
                        <div>
                            <strong>{file.name}</strong>
                            <p>{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button className="ptj-remove" onClick={reset}>✕</button>
                    </div>

                    {requiresPassword ? (
                        <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mt-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Enter PDF Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Type the password to unlock"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                               This file has a strict user password that is required to open it.
                            </p>
                        </div>
                    ) : (
                        <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl p-5 mt-4 text-center">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>Note:</strong> We will attempt to remove the owner password restriction automatically.
                            </p>
                        </div>
                    )}

                    <button 
                        className="ptj-btn ptj-primary ptj-btn-big mt-4 w-full" 
                        onClick={handleUnlock}
                        disabled={requiresPassword && !password}
                    >
                        {requiresPassword ? 'Unlock with Password' : 'Unlock PDF'}
                    </button>
                </div>
            )}

            {processing && (
                <div className="ptj-processing">
                    <div className="ptj-progress-bar">
                         <div className="ptj-progress-fill" style={{ width: '100%', animation: 'indeterminate 2s infinite linear' }} />
                    </div>
                    <p>Unlocking PDF...</p>
                </div>
            )}

            {error && (
                <div className="ptj-error-box max-w-2xl mx-auto w-full mt-4">⚠ {error}</div>
            )}

            <style>{css}</style>
        </div>
    );
}

const css = `
.ptj-root{display:flex;flex-direction:column;gap:20px;width:100%}

/* Buttons */
.ptj-btn{border:none;border-radius:10px;padding:14px 34px;font-size:1rem;font-weight:700;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;justify-content:center;gap:8px;line-height:1.2}
.ptj-primary{background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;box-shadow:0 4px 16px rgba(231,76,60,.35)}
.ptj-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(231,76,60,.45)}
.ptj-outline{background:var(--surface-solid,#fff);color:var(--text-heading,#1a1a2e);border:1.5px solid var(--surface-border,#d1d5db)}
.ptj-outline:hover{border-color:#e74c3c;color:#e74c3c}
.ptj-btn-big{width:100%;padding:18px;font-size:1.1rem;border-radius:12px}

/* File ready */
.ptj-file-ready{display:flex;flex-direction:column;align-items:center}
.ptj-file-info{display:flex;align-items:center;gap:14px;padding:16px 20px;background:var(--surface-solid,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:12px;}
.ptj-file-icon{font-size:2rem}
.ptj-file-info div{flex:1;min-width:0}
.ptj-file-info strong{display:block;font-size:.95rem;color:var(--text-heading,#1a1a2e);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ptj-file-info p{margin:2px 0 0;font-size:.82rem;color:var(--text-soft,#6b7280)}
.ptj-remove{width:32px;height:32px;border-radius:50%;border:none;background:rgba(220,38,38,.1);color:#dc2626;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:background .2s}
.ptj-remove:hover{background:rgba(220,38,38,.2)}

/* Processing */
.ptj-processing{text-align:center;padding:40px 20px; max-width: 500px; margin: 0 auto; width: 100%;}
.ptj-processing p{margin:16px 0 0;color:var(--text-soft,#6b7280);font-size:1.1rem; font-weight: 500;}
.ptj-progress-bar{height:10px;border-radius:10px;background:var(--surface-border,#e5e7eb);overflow:hidden; position: relative;}
.ptj-progress-fill{height:100%;border-radius:10px;background:linear-gradient(90deg,#e74c3c,#f97316); position: absolute; left: 0; top: 0;}

@keyframes indeterminate {
  0% { transform: translateX(-100%); width: 50%; }
  100% { transform: translateX(200%); width: 50%; }
}

/* Error */
.ptj-error-box{padding:14px 18px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);border-radius:12px;color:#f87171;font-size:.92rem;text-align:center}

/* Done bar */
.ptj-done-bar{display:flex;align-items:center;gap:14px;padding:24px;background:var(--surface-solid,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:16px; max-width: 600px; margin: 0 auto 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);}
.ptj-done-icon{font-size:2.5rem}
.ptj-done-bar strong{font-size:1.2rem;color:var(--text-heading,#1a1a2e); display: block; margin-bottom: 4px;}
.ptj-done-bar p{margin:0;font-size:.95rem;color:var(--text-soft,#6b7280)}

/* Top actions */
.ptj-actions-top{display:flex;gap:12px;justify-content:center;flex-wrap:wrap; width: 100%;}

.mt-4 { margin-top: 1rem; }
`;


