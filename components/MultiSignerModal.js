'use client';
import React, { useState } from 'react';
import { User, Mail, Shield, Smartphone, PenTool, X, Users, RefreshCw, Calendar, Users as MultipleUsers, UserPlus } from 'lucide-react';

export default function MultiSignerModal({ onCancel, onApply }) {
  const [receivers, setReceivers] = useState([{ id: 1, name: '', email: '', role: 'Signer' }]);
  const [orderReceivers, setOrderReceivers] = useState(false);
  const [changeExpiration, setChangeExpiration] = useState(false);
  const [multipleRequests, setMultipleRequests] = useState(false);

  const addReceiver = () => {
    setReceivers([...receivers, { id: Date.now(), name: '', email: '', role: 'Signer' }]);
  };

  const removeReceiver = (id) => {
    if (receivers.length > 1) {
      setReceivers(receivers.filter(r => r.id !== id));
    }
  };

  return (
    <div className="ms-modal-overlay">
      <div className="ms-modal">
        <div className="ms-modal-header">
          <h2>Create your signature request</h2>
        </div>
        
        <div className="ms-modal-body">
          <div className="ms-section">
            <label className="ms-label">Who will receive your document?</label>
            
            <div className="ms-receivers-list">
              {receivers.map((receiver, index) => (
                <div key={receiver.id} className="ms-receiver-row">
                  <div className="ms-drag-handle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                  </div>
                  <div className="ms-line-indicator" style={{ backgroundColor: index % 2 === 0 ? '#ffcccb' : '#bae6fd' }}></div>
                  <div className="ms-input-group ms-name-group">
                    <input 
                      type="text" 
                      placeholder="Name" 
                      className="ms-input" 
                      value={receiver.name}
                      onChange={(e) => {
                        const newReceivers = [...receivers];
                        newReceivers[index].name = e.target.value;
                        setReceivers(newReceivers);
                      }}
                    />
                  </div>
                  <div className="ms-input-group ms-email-group">
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className="ms-input" 
                      value={receiver.email}
                      onChange={(e) => {
                        const newReceivers = [...receivers];
                        newReceivers[index].email = e.target.value;
                        setReceivers(newReceivers);
                      }}
                    />
                  </div>
                  <div className="ms-input-group ms-role-group">
                    <select 
                      className="ms-select"
                      value={receiver.role}
                      onChange={(e) => {
                        const newReceivers = [...receivers];
                        newReceivers[index].role = e.target.value;
                        setReceivers(newReceivers);
                      }}
                    >
                      <option value="Signer">Signer</option>
                      <option value="Viewer">Viewer</option>
                      <option value="Witness">Witness</option>
                      <option value="Validator">Validator</option>
                    </select>
                  </div>
                  <div className="ms-actions">
                    <button className="ms-icon-btn"><Shield size={14} /></button>
                    <button className="ms-icon-btn"><Smartphone size={14} /></button>
                    <button className="ms-icon-btn"><PenTool size={14} /></button>
                    <button className="ms-icon-btn ms-delete" onClick={() => removeReceiver(receiver.id)}><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="ms-add-btn" onClick={addReceiver}>
              <UserPlus size={16} /> ADD RECEIVER
            </button>
          </div>

          <div className="ms-section">
            <h3 className="ms-settings-title">Settings</h3>
            
            <label className={`ms-setting-row ${orderReceivers ? 'active' : ''}`}>
              <div className="ms-checkbox-wrap">
                <input type="checkbox" checked={orderReceivers} onChange={() => setOrderReceivers(!orderReceivers)} />
                <span className="ms-checkmark"></span>
              </div>
              <div className="ms-setting-content">
                <div className="ms-setting-header">
                  <RefreshCw size={18} color="#94a3b8" />
                  <h4>Set the order of receivers</h4>
                </div>
                <p>Select this option to set a signing order. A signer won&apos;t receive a request until the previous person has completed their document.</p>
              </div>
            </label>

            <label className={`ms-setting-row ${changeExpiration ? 'active' : ''}`}>
              <div className="ms-checkbox-wrap">
                <input type="checkbox" checked={changeExpiration} onChange={() => setChangeExpiration(!changeExpiration)} />
                <span className="ms-checkmark"></span>
              </div>
              <div className="ms-setting-content">
                <div className="ms-setting-header">
                  <Calendar size={18} color="#2980b9" />
                  <h4 style={{ color: '#1e293b' }}>Change expiration date</h4>
                </div>
                <p style={{ color: '#334155' }}>
                  The document will expire in <strong>15 days</strong>.<br/>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Expires on: 5/11/2026</span>
                </p>
              </div>
            </label>

            <label className={`ms-setting-row ${multipleRequests ? 'active' : ''}`}>
              <div className="ms-checkbox-wrap">
                <input type="checkbox" checked={multipleRequests} onChange={() => setMultipleRequests(!multipleRequests)} />
                <span className="ms-checkmark"></span>
              </div>
              <div className="ms-setting-content">
                <div className="ms-setting-header">
                  <MultipleUsers size={18} color="#2980b9" />
                  <h4 style={{ color: '#1e293b' }}>Multiple requests</h4>
                </div>
                <p style={{ color: '#334155' }}>This option will allow each signer to receive a unique and separate request to sign individually.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="ms-modal-footer">
          <button className="ms-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="ms-btn-apply" onClick={() => onApply({ receivers, orderReceivers, changeExpiration, multipleRequests })}>Apply</button>
        </div>
      </div>

      <style>{`
        .ms-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000;
          overflow-y: auto;
          padding: 20px;
        }
        .ms-modal {
          background: #fff;
          width: 800px;
          max-width: 95%;
          max-height: 90vh;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .ms-modal-header {
          padding: 24px 32px;
          border-bottom: 1px solid #e2e8f0;
        }
        .ms-modal-header h2 {
          margin: 0; font-size: 1.5rem; color: #1e293b; font-weight: 600;
        }
        .ms-modal-body {
          padding: 32px;
          display: flex; flex-direction: column; gap: 40px;
          overflow-y: auto;
          flex: 1;
        }
        .ms-label {
          font-size: 0.95rem; font-weight: 500; color: #64748b; margin-bottom: 12px; display: block;
        }
        .ms-receivers-list {
          display: flex; flex-direction: column; gap: 12px;
        }
        .ms-receiver-row {
          display: flex; align-items: center; gap: 8px;
          background: #fff;
          width: 100%;
        }
        .ms-drag-handle { cursor: grab; padding: 0 4px; display: flex; align-items: center; }
        .ms-line-indicator { width: 3px; height: 38px; border-radius: 2px; margin: 0 4px; }
        .ms-input-group { display: flex; align-items: center; }
        .ms-name-group { flex: 1; min-width: 0; }
        .ms-email-group { flex: 1.2; min-width: 0; }
        .ms-role-group { flex: 0.8; min-width: 0; }
        .ms-input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; color: #334155; background: #fff; height: 38px; }
        .ms-input::placeholder { color: #94a3b8; }
        .ms-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .ms-select { width: 100%; padding: 8px 30px 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; color: #334155; background: #fff; cursor: pointer; height: 38px; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 10px top 50%; background-size: 10px auto; }
        .ms-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .ms-actions { display: flex; gap: 4px; align-items: center; margin-left: 4px; flex-shrink: 0; }
        .ms-icon-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9; color: #94a3b8; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .ms-icon-btn:hover { background: #e2e8f0; color: #475569; }
        .ms-icon-btn.ms-delete:hover { color: #e74c3c; background: #fee2e2; }
        .ms-add-btn { width: 100%; padding: 12px; background: #f0f7ff; border: 1px solid #bae6fd; border-radius: 4px; color: #3b82f6; font-weight: 600; font-size: 0.85rem; letter-spacing: 0.5px; display: flex; justify-content: center; align-items: center; gap: 8px; cursor: pointer; margin-top: 16px; transition: 0.2s; }
        .ms-add-btn:hover { background: #e0f2fe; }

        .ms-settings-title { font-size: 1.2rem; color: #1e293b; font-weight: 600; margin: 0 0 20px; }
        .ms-setting-row { display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
        .ms-setting-row:last-child { border-bottom: none; }
        .ms-checkbox-wrap { position: relative; width: 20px; height: 20px; margin-top: 2px; }
        .ms-checkbox-wrap input { opacity: 0; width: 100%; height: 100%; cursor: pointer; margin: 0; z-index: 2; position: absolute; }
        .ms-checkmark { position: absolute; top: 0; left: 0; width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 4px; transition: 0.2s; }
        .ms-checkbox-wrap input:checked ~ .ms-checkmark { background-color: #2980b9; border-color: #2980b9; }
        .ms-checkbox-wrap input:checked ~ .ms-checkmark:after { content: ''; position: absolute; display: block; left: 5px; top: 2px; width: 6px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
        
        .ms-setting-content { flex: 1; }
        .ms-setting-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .ms-setting-header h4 { margin: 0; font-size: 1rem; color: #94a3b8; font-weight: 600; transition: color 0.2s; }
        .ms-setting-row.active .ms-setting-header h4 { color: #1e293b; }
        .ms-setting-content p { margin: 0; font-size: 0.95rem; color: #94a3b8; line-height: 1.5; transition: color 0.2s; }
        .ms-setting-row.active .ms-setting-content p { color: #334155; }

        .ms-modal-footer { padding: 20px 32px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; align-items: center; gap: 24px; background: #f8fafc; border-radius: 0 0 8px 8px; }
        .ms-btn-cancel { background: transparent; border: none; color: #e74c3c; font-weight: 600; font-size: 1rem; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; }
        .ms-btn-cancel:hover { color: #c0392b; }
        .ms-btn-apply { background: #e74c3c; color: #fff; border: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.2s; }
        .ms-btn-apply:hover { background: #c0392b; }
      `}</style>
    </div>
  );
}
