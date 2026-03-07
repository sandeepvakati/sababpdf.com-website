'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white my-8 max-w-2xl mx-auto text-center">
            <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm w-full">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-6 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    {error?.message || 'An unexpected error occurred while loading this page. Please refresh and try again.'}
                </p>
                <button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-md text-lg"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
