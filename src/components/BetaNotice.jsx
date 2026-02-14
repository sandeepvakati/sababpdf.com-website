import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const BetaNotice = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm md:text-base">
                        <span className="font-bold">🚀 Beta Version:</span> We're actively developing new features. Some tools may be in testing phase. Thank you for your patience!
                    </p>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-white hover:bg-white/20 rounded-full p-1 transition-colors flex-shrink-0"
                    aria-label="Close notice"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default BetaNotice;
