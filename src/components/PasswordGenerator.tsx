'use client';

import React, { useState, useEffect } from 'react';

const PasswordGenerator: React.FC = () => {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [excludeLookalikes, setExcludeLookalikes] = useState(true);
    const [copyText, setCopyText] = useState('Copy');

    const handleGeneratePassword = () => {
        const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lookalikeLetters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        const lookalikeNumbers = '23456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let charSet = excludeLookalikes ? lookalikeLetters : letters;
        if (includeNumbers) {
            charSet += excludeLookalikes ? lookalikeNumbers : numbers;
        }
        if (includeSymbols) {
            charSet += symbols;
        }
        let generatedPassword = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charSet.length);
            generatedPassword += charSet[randomIndex];
        }
        setPassword(generatedPassword);
        setCopyText('Copy');
    };

    const handleCopyPassword = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopyText('Copied!');
        setTimeout(() => {
            setCopyText('Copy');
        }, 2000);
    };

    useEffect(() => {
        handleGeneratePassword();
    }, [length, includeNumbers, includeSymbols, excludeLookalikes]);

    const getTrackColor = () => {
        if (length < 16) return '#f59e0b'; 
        if (length < 25) return '#3b82f6';
        return '#22c55e'; 
    };

    const min = 8;
    const max = 32;
    const fillPercent = ((length - min) / (max - min)) * 100;

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-transparent">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Password Generator</h1>

            <div className="flex items-center p-4 bg-gray-100 dark:bg-slate-900 rounded-lg">
                <span className="flex-grow text-lg font-mono text-gray-700 dark:text-gray-300 truncate">
                    {password || 'Your Password...'}
                </span>
                <button
                    onClick={handleCopyPassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 min-w-[70px]"
                >
                    {copyText}
                </button>
            </div>

            <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between items-center">
                    <label htmlFor="length" className="text-lg">Password Length</label>
                    <span className="px-3 py-1 text-lg font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-slate-700 rounded-md">{length}</span>
                </div>
                <input
                    type="range"
                    id="length"
                    min={min}
                    max={max}
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    style={{
                        '--fill-percent': `${fillPercent}%`,
                        '--track-color': getTrackColor(),
                    } as React.CSSProperties}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex items-center pt-2">
                    <input
                        type="checkbox"
                        id="numbers"
                        checked={includeNumbers}
                        onChange={() => setIncludeNumbers(!includeNumbers)}
                        className="w-5 h-5 accent-blue-500"
                    />
                    <label htmlFor="numbers" className="ml-3 text-lg">Include Numbers</label>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="symbols"
                        checked={includeSymbols}
                        onChange={() => setIncludeSymbols(!includeSymbols)}
                        className="w-5 h-5 accent-blue-500"
                    />
                    <label htmlFor="symbols" className="ml-3 text-lg">Include Symbols</label>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="lookalikes"
                        checked={excludeLookalikes}
                        onChange={() => setExcludeLookalikes(!excludeLookalikes)}
                        className="w-5 h-5 accent-blue-500"
                    />
                    <label htmlFor="lookalikes" className="ml-3 text-lg">Exclude Look-alikes (i, l, 1, O, 0)</label>
                </div>
            </div>

            <button
                onClick={handleGeneratePassword}
                className="w-full py-3 text-lg font-bold text-white bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity"
            >
                Generate Password
            </button>
        </div>
    );
};

export default PasswordGenerator;