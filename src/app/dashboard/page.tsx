'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import PasswordGenerator from '@/components/PasswordGenerator';

// --- Type Definitions ---
type DecryptedVaultItem = {
  _id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');


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

  // Feature State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

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
    }
  }, [selectedItem]);


  // --- UI Control Functions ---

  const clearForm = () => {
    setTitle(''); setUsername(''); setPassword(''); setUrl(''); setNotes('');
    setTags([]);
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

    const itemData = { title, username, password, url, notes, tags };
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


  const handleExport = () => {
    if (decryptedItems.length === 0) {
      showNotification('Vault is empty, nothing to export.', 'error');
      return;
    }
    setIsExportModalOpen(true);
  };

  const confirmExport = () => {
    if (!exportPassword || exportPassword !== masterPassword) {
      showNotification('Incorrect master password.', 'error');
      return;
    }

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'csv') {
        // Create CSV format
        const headers = ['Title', 'Username', 'Password', 'URL', 'Notes', 'Tags'];
        const csvRows = [
          headers.join(','),
          ...decryptedItems.map(item => [
            `"${(item.title || '').replace(/"/g, '""')}"`,
            `"${(item.username || '').replace(/"/g, '""')}"`,
            `"${(item.password || '').replace(/"/g, '""')}"`,
            `"${(item.url || '').replace(/"/g, '""')}"`,
            `"${(item.notes || '').replace(/"/g, '""')}"`,
            `"${(item.tags || []).join('; ').replace(/"/g, '""')}"`
          ].join(','))
        ];

        content = csvRows.join('\n');
        filename = `passwordvault_export_${dateStr}.csv`;
        mimeType = 'text/csv;charset=utf-8';
      } else {
        // Create JSON format
        const exportData = {
          exportInfo: {
            version: "1.0",
            exportDate: new Date().toISOString(),
            totalItems: decryptedItems.length,
            source: "PasswordVault made by Riya Kuila",
            poweredBy: "PasswordVault made by Riya Kuila"
          },
          vaultItems: decryptedItems.map(item => ({
            title: item.title,
            username: item.username,
            password: item.password || '',
            url: item.url || '',
            notes: item.notes || '',
            tags: item.tags || []
          })),
          footer: {
            poweredBy: "PasswordVault made by Riya Kuila",
            exportedOn: new Date().toLocaleString()
          }
        };
        content = JSON.stringify(exportData, null, 2);
        filename = `passwordvault_export_${dateStr}.json`;
        mimeType = 'application/json;charset=utf-8';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showNotification(`Vault exported successfully as ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      showNotification('Error exporting vault.', 'error');
    } finally {
      setIsExportModalOpen(false);
      setExportPassword('');
    }
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

  if (status === 'loading') return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p>Loading...</p></div>;
  if (!session) return null;

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-sm p-8 space-y-4 bg-white shadow-lg rounded-xl dark:bg-slate-800">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Unlock Your LockBox</h2>
          <input type="password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlockVault()} placeholder="Master Password" className="w-full px-3 py-2 text-gray-900 bg-gray-200 rounded-md dark:text-white dark:bg-slate-700" />
          {unlockError && <p className="text-sm text-center text-red-500">{unlockError}</p>}
          <button onClick={handleUnlockVault} disabled={isLoading} className="w-full py-3 font-bold text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
      {/* --- Modals and Notifications --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6 bg-black/50">
          <div className="w-full max-w-sm p-6 mx-4 border shadow-2xl rounded-2xl backdrop-blur-xl sm:p-8 sm:mx-0 bg-white/90 border-white/20 dark:bg-slate-800/90 dark:border-slate-700/30">
            <h3 className="mb-4 text-xl font-bold">Confirm Deletion</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">Permanently delete <span className="font-semibold">"{itemToDelete?.title}"</span>?</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-end">
              <button onClick={() => setIsDeleteModalOpen(false)} className="order-2 px-4 py-2 font-semibold transition-all border rounded-xl backdrop-blur-sm bg-white/70 border-gray-200/50 hover:bg-white/90 dark:bg-slate-600/70 dark:border-slate-500/50 dark:hover:bg-slate-600/90 sm:order-1">Cancel</button>
              <button onClick={confirmDeleteItem} className="order-1 px-4 py-2 font-semibold text-white transition-all border rounded-xl backdrop-blur-sm bg-red-500/90 border-red-400/30 hover:bg-red-600/95 hover:border-red-300/50 sm:order-2">Delete</button>
            </div>
          </div>
        </div>
      )}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6 bg-black/50">
          <div className="w-full max-w-sm p-6 mx-4 border shadow-2xl rounded-2xl backdrop-blur-xl sm:p-8 sm:mx-0 bg-white/90 border-white/20 dark:bg-slate-800/90 dark:border-slate-700/30">
            <h3 className="mb-4 text-xl font-bold">Confirm Import</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">Enter the master password for this backup file to decrypt and import its contents.</p>
            <input type="password" value={importPassword} onChange={e => setImportPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmImport()} placeholder="Backup's Master Password" className="w-full px-4 py-3 mb-6 text-gray-900 transition-all border outline-none rounded-xl backdrop-blur-sm bg-white/60 border-gray-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 focus:bg-white/80 dark:text-white dark:bg-slate-700/60 dark:border-slate-600/50 dark:focus:bg-slate-700/80" />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setIsImportModalOpen(false)} className="order-2 px-6 py-2 font-semibold transition-all border rounded-xl backdrop-blur-sm bg-white/70 border-gray-200/50 hover:bg-white/90 hover:border-gray-300/60 dark:bg-slate-600/70 dark:border-slate-500/50 dark:hover:bg-slate-600/90 sm:order-1">Cancel</button>
              <button onClick={confirmImport} disabled={isLoading} className="order-1 px-6 py-2 font-semibold text-white transition-all border rounded-xl backdrop-blur-sm bg-blue-500/90 border-blue-400/30 hover:bg-blue-600/95 hover:border-blue-300/50 disabled:bg-gray-400/70 disabled:border-gray-400/30 disabled:cursor-not-allowed sm:order-2">{isLoading ? 'Importing...' : 'Import Items'}</button>
            </div>
          </div>
        </div>
      )}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6 bg-black/50">
          <div className="w-full max-w-sm p-6 mx-4 border shadow-2xl rounded-2xl backdrop-blur-xl sm:p-8 sm:mx-0 bg-white/90 border-white/20 dark:bg-slate-800/90 dark:border-slate-700/30">
            <div className="flex flex-col items-center mb-6 text-center sm:flex-row sm:items-center sm:mb-4 sm:text-left">
              <div className="flex items-center justify-center w-12 h-12 mb-3 border rounded-full backdrop-blur-sm sm:mb-0 sm:mr-4 bg-blue-100/70 border-blue-200/50 dark:bg-blue-900/70 dark:border-blue-800/50">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Export Vault</h3>
            </div>
            <p className="mb-4 text-center text-gray-600 dark:text-gray-300 sm:text-left">
              Confirm your master password to export your vault data in readable format. This will contain all your passwords and vault items in plain text.
            </p>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Export Format:</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">CSV (Spreadsheet)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">JSON (Structured)</span>
                </label>
              </div>
            </div>

            <input
              type="password"
              value={exportPassword}
              onChange={e => setExportPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmExport()}
              placeholder="Enter your master password"
              className="w-full px-4 py-3 mb-6 text-gray-900 transition-all border outline-none rounded-xl backdrop-blur-sm bg-white/60 border-gray-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 focus:bg-white/80 dark:text-white dark:bg-slate-700/60 dark:border-slate-600/50 dark:focus:bg-slate-700/80"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => { setIsExportModalOpen(false); setExportPassword(''); }}
                className="order-2 px-6 py-2 font-semibold text-gray-700 transition-all border rounded-xl backdrop-blur-sm bg-white/70 border-gray-200/50 hover:bg-white/90 hover:border-gray-300/60 dark:text-gray-300 dark:bg-slate-600/70 dark:border-slate-500/50 dark:hover:bg-slate-600/90 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                disabled={!exportPassword}
                className="order-1 px-6 py-2 font-semibold text-white transition-all border bg-gradient-to-r rounded-xl backdrop-blur-sm from-blue-500/90 to-purple-600/90 border-blue-400/30 hover:from-blue-600/95 hover:to-purple-700/95 hover:border-blue-300/50 disabled:from-gray-400/70 disabled:to-gray-500/70 disabled:cursor-not-allowed disabled:border-gray-400/30 sm:order-2"
              >
                Export Vault
              </button>
            </div>
          </div>
        </div>
      )}
      {notification && (
        <div className={`fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      <div className="container max-w-4xl px-4 py-8 mx-auto">
        {activeView === 'list' ? (
          // --- ITEM LIST VIEW ---
          <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-slate-800">
            <div className="flex flex-col items-center justify-between gap-4 mb-6 sm:flex-row">
              <h2 className="text-3xl font-bold">Vault Items</h2>
              <button onClick={showAddForm} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg sm:w-auto hover:bg-blue-700">
                + Add New
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
              <input type="text" placeholder="Search vault..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-md md:col-span-2 dark:bg-slate-700" />
              <div className="flex justify-end gap-2">
                <button onClick={handleExport} className="w-1/2 px-3 py-2 text-sm bg-gray-200 rounded-md md:w-auto dark:bg-slate-600">Export</button>
                <button onClick={() => importFileRef.current?.click()} className="w-1/2 px-3 py-2 text-sm bg-gray-200 rounded-md md:w-auto dark:bg-slate-600">Import</button>
                <input type="file" ref={importFileRef} onChange={handleImportFileSelect} accept=".txt" className="hidden" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-4 mb-6 border-b border-gray-200 dark:border-slate-700">
              <button onClick={() => setActiveTagFilter(null)} className={`px-3 py-1 text-sm rounded-full ${!activeTagFilter ? 'text-white bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}>All</button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`px-3 py-1 text-sm rounded-full ${activeTagFilter === tag ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-600'}`}>{tag}</button>
              ))}
            </div>
            {filteredItems.length === 0 ? (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">No items found.</p>
            ) : (
              <ul className="space-y-3">
                {filteredItems.map(item => (
                  <li key={item._id} onClick={() => showDetailsForm(item)} className="p-4 bg-gray-100 rounded-lg cursor-pointer dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.username}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // --- ADD/EDIT ITEM VIEW ---
          <div className="grid items-start grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-slate-800">
              <div className="flex items-center mb-6">
                <button onClick={showList} className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">&larr;</button>
                <h2 className="text-3xl font-bold">{selectedItem ? 'Item Details' : 'Add New Item'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Standard Fields */}
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-md dark:bg-slate-700" required />
                <input type="text" placeholder="Username or Email" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-md dark:bg-slate-700" required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-md dark:bg-slate-700" required />
                <input type="url" placeholder="URL (e.g., https://google.com)" value={url} onChange={e => setUrl(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-md dark:bg-slate-700" />
                <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-24 px-4 py-3 bg-gray-100 rounded-md dark:bg-slate-700" />
                <input type="text" placeholder="Tags, separated by commas" value={tags.join(', ')} onChange={e => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))} className="w-full px-4 py-3 bg-gray-100 rounded-md dark:bg-slate-700" />


                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
                  {selectedItem && (
                    <button type="button" onClick={() => handleDeleteClick(selectedItem)} className="order-2 w-full px-6 py-3 font-bold text-white bg-red-600 rounded-lg sm:w-auto sm:order-1">Delete</button>
                  )}
                  <button type="submit" className="order-1 w-full px-6 py-3 font-bold text-white bg-blue-600 rounded-lg sm:w-auto sm:order-2">{selectedItem ? 'Update Item' : 'Save Item'}</button>
                </div>
              </form>
            </div>

            {/* Side Panel: Password Generator */}
            <div className="space-y-8">
              <PasswordGenerator />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

