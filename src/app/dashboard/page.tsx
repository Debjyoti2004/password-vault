'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import PasswordGenerator from '@/components/PasswordGenerator';
import * as otpauth from 'otpauth';

// --- Type Definitions ---
type DecryptedVaultItem = {
  _id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  totpSecret?: string;
};

type NotificationType = {
  message: string;
  type: 'success' | 'error';
};

// --- Main Dashboard Component ---
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- State Management ---
  const [decryptedItems, setDecryptedItems] = useState<DecryptedVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI Control State
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [notification, setNotification] = useState<NotificationType | null>(null);
  
  // Modals State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DecryptedVaultItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importPassword, setImportPassword] = useState('');


  // Unlock State
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Selected Item & Form State
  const [selectedItem, setSelectedItem] = useState<DecryptedVaultItem | null>(null);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Feature State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [currentOtp, setCurrentOtp] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(30);
  
  const clipboardClearTimer = useRef<NodeJS.Timeout | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  
  // Helper to show notifications
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Populate form when an item is selected
  useEffect(() => {
    if (selectedItem) {
      setTitle(selectedItem.title);
      setUsername(selectedItem.username);
      setPassword(selectedItem.password || '');
      setUrl(selectedItem.url || '');
      setNotes(selectedItem.notes || '');
      setTags(selectedItem.tags || []);
      setTotpSecret(selectedItem.totpSecret || '');
      setQrCodeUrl(''); // Clear QR code when selecting an existing item
    }
  }, [selectedItem]);

  // Live TOTP code generation
  useEffect(() => {
    if (!selectedItem?.totpSecret) {
      setCurrentOtp('');
      return;
    }
    const totp = new otpauth.TOTP({ secret: selectedItem.totpSecret });
    const updateOtp = () => {
      setCurrentOtp(totp.generate());
      setOtpExpiresIn(totp.period - (Math.floor(Date.now() / 1000) % totp.period));
    };
    updateOtp();
    const interval = setInterval(updateOtp, 1000);
    return () => clearInterval(interval);
  }, [selectedItem]);

  // --- UI Control Functions ---

  const clearForm = () => {
    setTitle(''); setUsername(''); setPassword(''); setUrl(''); setNotes('');
    setTags([]); setTotpSecret(''); setQrCodeUrl('');
  };

  const showList = () => {
    setActiveView('list');
    setSelectedItem(null);
    clearForm();
  };
  
  const showAddForm = () => {
    setSelectedItem(null);
    clearForm();
    setActiveView('form');
  };

  const showDetailsForm = (item: DecryptedVaultItem) => {
    setSelectedItem(item);
    setActiveView('form');
  };
  
  // --- Core Logic Functions ---
  
  const handleUnlockVault = async () => {
    if (!masterPassword) { setUnlockError('Please enter master password.'); return; }
    setIsLoading(true); setUnlockError('');
    try {
      const res = await fetch('/api/vault');
      if (!res.ok) throw new Error('Failed to fetch vault items.');
      const data = await res.json();
      if (data.success) {
        const encryptedItems = data.data;
        const allDecrypted = encryptedItems.map((item: any) => {
          const decrypted = decryptData(item.encryptedData, masterPassword);
          return decrypted ? { ...(decrypted as object), _id: item._id } as DecryptedVaultItem : null;
        }).filter((i: DecryptedVaultItem | null): i is DecryptedVaultItem => !!i);
        if (encryptedItems.length > 0 && allDecrypted.length === 0) {
          setUnlockError('Incorrect master password.');
        } else {
          setDecryptedItems(allDecrypted);
          setIsUnlocked(true);
        }
      } else { throw new Error(data.message); }
    } catch (error: any) { setUnlockError(error.message); } 
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !username || !password) { showNotification("Title, username, and password are required.", 'error'); return; }
    
    const itemData = { title, username, password, url, notes, tags, totpSecret };
    const encryptedData = encryptData(itemData, masterPassword);

    const apiEndpoint = selectedItem ? `/api/vault/${selectedItem._id}` : '/api/vault';
    const method = selectedItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData }),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedItem) {
          setDecryptedItems(decryptedItems.map(item => 
            item._id === selectedItem._id ? { ...itemData, _id: selectedItem._id } : item
          ));
        } else {
          setDecryptedItems([...decryptedItems, { ...itemData, _id: data.data._id }]);
        }
        showNotification(`Successfully ${selectedItem ? 'updated' : 'saved'} "${itemData.title}"!`);
        showList();
      } else { throw new Error(data.message); }
    } catch (error) { showNotification(`Error: Failed to ${selectedItem ? 'update' : 'save'} item.`, 'error'); }
  };

  const handleDeleteClick = (item: DecryptedVaultItem) => {
    setItemToDelete(item); setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/vault/${itemToDelete._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDecryptedItems(decryptedItems.filter(item => item._id !== itemToDelete._id));
        showNotification(`Deleted "${itemToDelete.title}" successfully!`);
      } else { throw new Error(data.message); }
    } catch (error) { showNotification('An error occurred while deleting.', 'error'); } 
    finally { setIsDeleteModalOpen(false); setItemToDelete(null); showList(); }
  };

  // --- Feature Logic ---

  const copyToClipboard = (text: string | undefined, isSecret: boolean = false) => {
    if (!text) return;
    if (clipboardClearTimer.current) clearTimeout(clipboardClearTimer.current);

    navigator.clipboard.writeText(text);

    if (isSecret) {
      showNotification('Copied! Clearing in 15 seconds...');
      clipboardClearTimer.current = setTimeout(() => {
        navigator.clipboard.writeText(' ');
        showNotification('Clipboard cleared.');
        clipboardClearTimer.current = null;
      }, 15000);
    } else {
      showNotification('Copied to clipboard!');
    }
  };

  const setupTotp = async () => {
    try {
      const res = await fetch('/api/vault/generate-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username || title, issuer: 'LockBox' })
      });
      const data = await res.json();
      if (data.success) {
        setTotpSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
      } else {
        throw new Error(data.message || 'Failed to generate TOTP');
      }
    } catch (error) { showNotification('Error setting up 2FA.', 'error'); }
  };

  const handleExport = () => {
    if (decryptedItems.length === 0) {
      showNotification('Vault is empty, nothing to export.', 'error');
      return;
    }
    const password = prompt("Confirm your master password to encrypt the export file:");
    if (!password || password !== masterPassword) {
      alert("Incorrect master password.");
      return;
    }
    const dataToExport = { version: "1.0", items: decryptedItems };
    const encryptedExport = encryptData(dataToExport, password);
    const blob = new Blob([encryptedExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lockbox_export_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Vault exported successfully!');
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportFileContent(content);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!importFileContent || !importPassword) {
      showNotification('Password is required to import.', 'error');
      return;
    }

    try {
      const decryptedData = decryptData(importFileContent, importPassword);
      if (!decryptedData || !Array.isArray((decryptedData as any).items)) {
        throw new Error("Decryption failed. Check password or file format.");
      }
      const itemsToImport = (decryptedData as any).items;
      
      setIsLoading(true);
      let successCount = 0;
      for (const item of itemsToImport) {
        const { _id, ...itemData } = item; // Exclude old ID
        const encryptedData = encryptData(itemData, masterPassword);
        const res = await fetch('/api/vault', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encryptedData })
        });
        if (res.ok) successCount++;
      }
      showNotification(`${successCount} of ${itemsToImport.length} items imported successfully!`);
      // After import, refresh data by unlocking again
      await handleUnlockVault();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
      setIsImportModalOpen(false);
      setImportFileContent(null);
      setImportPassword('');
    }
  };
  
  // --- Render Filtering ---
  
  const allTags = [...new Set(decryptedItems.flatMap(item => item.tags || []))].sort();
  
  const filteredItems = decryptedItems.filter(item => {
    const matchesSearch = searchQuery ? 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesTag = activeTagFilter ? item.tags?.includes(activeTagFilter) : true;
    return matchesSearch && matchesTag;
  });

  // --- JSX Output ---

  if (status === 'loading') return <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900"><p>Loading...</p></div>;
  if (!session) return null;

  if (!isUnlocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-sm p-8 space-y-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Unlock Your LockBox</h2>
          <input type="password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlockVault()} placeholder="Master Password" className="w-full px-3 py-2 text-gray-900 dark:text-white bg-gray-200 dark:bg-slate-700 rounded-md"/>
          {unlockError && <p className="text-red-500 text-sm text-center">{unlockError}</p>}
          <button onClick={handleUnlockVault} disabled={isLoading} className="w-full py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-20">
      {/* --- Modals and Notifications --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Permanently delete <span className="font-semibold">"{itemToDelete?.title}"</span>?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 font-semibold bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
              <button onClick={confirmDeleteItem} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Import</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Enter the master password for this backup file to decrypt and import its contents.</p>
            <input type="password" value={importPassword} onChange={e => setImportPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmImport()} placeholder="Backup's Master Password" className="w-full px-3 py-2 mb-6 text-gray-900 dark:text-white bg-gray-200 dark:bg-slate-700 rounded-md"/>
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 font-semibold bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
              <button onClick={confirmImport} disabled={isLoading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg disabled:bg-gray-500">{isLoading ? 'Importing...' : 'Import Items'}</button>
            </div>
          </div>
        </div>
      )}
      {notification && (
        <div className={`fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {activeView === 'list' ? (
          // --- ITEM LIST VIEW ---
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-3xl font-bold">Vault Items</h2>
              <button onClick={showAddForm} className="w-full sm:w-auto px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                + Add New
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input type="text" placeholder="Search vault..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:col-span-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md"/>
              <div className="flex justify-end gap-2">
                 <button onClick={handleExport} className="w-1/2 md:w-auto px-3 py-2 text-sm bg-gray-200 dark:bg-slate-600 rounded-md">Export</button>
                 <button onClick={() => importFileRef.current?.click()} className="w-1/2 md:w-auto px-3 py-2 text-sm bg-gray-200 dark:bg-slate-600 rounded-md">Import</button>
                 <input type="file" ref={importFileRef} onChange={handleImportFileSelect} accept=".txt" className="hidden" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 pb-4">
              <button onClick={() => setActiveTagFilter(null)} className={`px-3 py-1 text-sm rounded-full ${!activeTagFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-600'}`}>All</button>
              {allTags.map(tag => (
                  <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`px-3 py-1 text-sm rounded-full ${activeTagFilter === tag ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-600'}`}>{tag}</button>
              ))}
            </div>
            {filteredItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items found.</p>
            ) : (
              <ul className="space-y-3">
                {filteredItems.map(item => (
                  <li key={item._id} onClick={() => showDetailsForm(item)} className="p-4 rounded-lg cursor-pointer bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.username}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // --- ADD/EDIT ITEM VIEW ---
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-6">
                <button onClick={showList} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">&larr;</button>
                <h2 className="text-3xl font-bold">{selectedItem ? 'Item Details' : 'Add New Item'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Standard Fields */}
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md" required/>
                <input type="text" placeholder="Username or Email" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md" required/>
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md" required/>
                <input type="url" placeholder="URL (e.g., https://google.com)" value={url} onChange={e => setUrl(e.target.value)} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md"/>
                <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md h-24"/>
                <input type="text" placeholder="Tags, separated by commas" value={tags.join(', ')} onChange={e => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-md"/>
                
                {/* 2FA Section */}
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                  {totpSecret ? (
                      <div className="space-y-2">
                         <input type="text" readOnly value={totpSecret} className="w-full px-4 py-2 font-mono text-sm bg-gray-200 dark:bg-slate-600 rounded-md"/>
                         {qrCodeUrl && <img src={qrCodeUrl} alt="TOTP QR Code" className="mx-auto rounded-lg"/>}
                         <button type="button" onClick={() => {setTotpSecret(''); setQrCodeUrl('');}} className="text-sm text-red-500">Remove 2FA</button>
                      </div>
                  ) : (
                      <button type="button" onClick={setupTotp} className="w-full px-4 py-2 text-sm bg-gray-200 dark:bg-slate-600 rounded-md">Setup 2FA</button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-2">
                  {selectedItem && (
                    <button type="button" onClick={() => handleDeleteClick(selectedItem)} className="w-full sm:w-auto px-6 py-3 font-bold text-white bg-red-600 rounded-lg order-2 sm:order-1">Delete</button>
                  )}
                  <button type="submit" className="w-full sm:w-auto px-6 py-3 font-bold text-white bg-blue-600 rounded-lg order-1 sm:order-2">{selectedItem ? 'Update Item' : 'Save Item'}</button>
                </div>
              </form>
            </div>

            {/* Side Panel: Password Generator and 2FA Code Display */}
            <div className="space-y-8">
              {selectedItem && selectedItem.totpSecret && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                  <h3 className="font-semibold mb-2">Authenticator Code</h3>
                  <p className="font-mono text-4xl tracking-widest text-blue-500 dark:text-blue-400">{currentOtp}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Refreshes in {otpExpiresIn}s</p>
                </div>
              )}
              <PasswordGenerator />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

