'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { protectPDF, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('protect-pdf');

export default function ProtectPDFPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const process = async () => {
    if (!file) return;
    if (!password) return toast.error('Enter a password.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    if (password.length < 4) return toast.error('Password must be at least 4 characters.');
    setProcessing(true);
    try {
      const blob = await protectPDF(file, password);
      setResult(blob);
      toast.success('PDF protected with password!');
    } catch {
      toast.error('Failed to protect PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setPassword(''); setConfirm(''); };

  const strength = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={f => setFile(f[0])} accept=".pdf" label="Drop PDF to protect" />
      ) : !result ? (
        <>
          <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
          </div>

          <div style={{ maxWidth: 420 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>
                  {show ? '🙈' : '👁'}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[1, 2, 3].map(l => (
                    <div key={l} style={{ height: 4, flex: 1, borderRadius: 2, background: l <= strength ? strengthColor[strength] : '#e2e8f0', transition: 'background 0.2s' }} />
                  ))}
                  <span style={{ fontSize: 12, color: strengthColor[strength], fontWeight: 600, minWidth: 40 }}>{strengthLabel[strength]}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                style={{ ...inputStyle, borderColor: confirm && confirm !== password ? '#ef4444' : undefined }}
              />
              {confirm && confirm !== password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Passwords don't match</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Protecting...' : '🔒 Protect PDF'}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>PDF Protected!</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Your PDF is now password-protected. Keep your password safe.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `protected_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download Protected PDF</button>
            <button onClick={reset} className="btn-secondary">Protect Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}

const labelStyle = { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 };
const inputStyle = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'var(--font-plus-jakarta)' };
