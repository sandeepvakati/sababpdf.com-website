import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, LogOut, User, ChevronDown,
    Layers, Scissors, Minimize2, FileBadge, Crop,
    Image, FileSpreadsheet, Presentation,
    RotateCw, Hash, Stamp, ArrowRightLeft,
    FileImage, Lock, Unlock, Scan, Camera, Wrench, Globe, MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const tools = {
        organize: [
            { name: 'Merge PDF', to: '/merge-pdf', icon: Layers, color: 'text-red-500' },
            { name: 'Split PDF', to: '/split-pdf', icon: Scissors, color: 'text-green-500' },
        ],
        optimize: [
            { name: 'Compress PDF', to: '/compress-pdf', icon: Minimize2, color: 'text-blue-500' },
            { name: 'PDF to PDF/A', to: '/pdf-to-pdfa', icon: FileBadge, color: 'text-indigo-500' },
            { name: 'Repair PDF', to: '/repair-pdf', icon: Wrench, color: 'text-gray-500' },
            { name: 'Add Watermark', to: '/add-watermark', icon: Stamp, color: 'text-purple-600' }, // New
            { name: 'Crop PDF', to: '/crop-pdf', icon: Crop, color: 'text-orange-500' },
        ],
        convertToPdf: [
            { name: 'JPG to PDF', to: '/jpg-to-pdf', icon: Image, color: 'text-yellow-500' },
            { name: 'Word to PDF', to: '/word-to-pdf', icon: FileText, color: 'text-blue-600' },
            { name: 'Excel to PDF', to: '/excel-to-pdf', icon: FileSpreadsheet, color: 'text-green-600' },
            { name: 'PowerPoint to PDF', to: '/powerpoint-to-pdf', icon: Presentation, color: 'text-orange-600' },
            { name: 'HTML to PDF', to: '/html-to-pdf', icon: Globe, color: 'text-blue-600' },
            { name: 'Scan to PDF', to: '/scan-pdf', icon: Camera, color: 'text-orange-500' },
        ],
        convertFromPdf: [
            { name: 'PDF to JPG', to: '/pdf-to-jpg', icon: FileImage, color: 'text-yellow-500' },
            { name: 'PDF to Word', to: '/pdf-to-word', icon: FileText, color: 'text-blue-600' },
            { name: 'PDF to Excel', to: '/pdf-to-excel', icon: FileSpreadsheet, color: 'text-green-600' },
            { name: 'PDF to PowerPoint', to: '/pdf-to-powerpoint', icon: Presentation, color: 'text-orange-600' },

        ],
        edit: [
            { name: 'Rotate PDF', to: '/rotate-pdf', icon: RotateCw, color: 'text-indigo-600' },
            { name: 'Add Page Numbers', to: '/add-page-numbers', icon: Hash, color: 'text-pink-600' },
            { name: 'Add Watermark', to: '/add-watermark', icon: Stamp, color: 'text-purple-600' },
            { name: 'Compare PDF', to: '/compare-pdf', icon: ArrowRightLeft, color: 'text-pink-500' },
        ],
        security: [
            { name: 'Redact PDF', to: '/redact-pdf', icon: FileBadge, color: 'text-gray-800' },
            { name: 'Protect PDF', to: '/protect-pdf', icon: Lock, color: 'text-emerald-600' },
            { name: 'Unlock PDF', to: '/unlock-pdf', icon: Unlock, color: 'text-cyan-600' },
        ]
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100 relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 mr-6">
                            <div className="bg-red-500 p-1.5 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-2xl text-gray-900 tracking-tight">
                                Sabab<span className="text-red-500 font-light">PDF</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-1">
                            <div
                                className="relative group"
                                onMouseEnter={() => setIsMenuOpen(true)}
                                onMouseLeave={() => setIsMenuOpen(false)}
                            >
                                <button className="flex items-center space-x-1 text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-bold uppercase transition-colors">
                                    <span>All PDF Tools</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'transform rotate-180' : ''}`} />
                                </button>

                                {/* Mega Menu */}
                                {isMenuOpen && (
                                    <div className="absolute top-full left-0 w-[800px] bg-white shadow-xl rounded-b-xl border-t-4 border-red-500 p-6 grid grid-cols-4 gap-8">
                                        <div>
                                            <h3 className="font-bold text-red-500 mb-3 uppercase text-xs tracking-wider">Organize PDF</h3>
                                            <ul className="space-y-2">
                                                {tools.organize.map(tool => (
                                                    <li key={tool.to}>
                                                        <Link to={tool.to} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-3 group/item"><tool.icon className={`w-4 h-4 ${tool.color} transition-colors`} /><span>{tool.name}</span></Link>
                                                    </li>
                                                ))}
                                            </ul>
                                            <h3 className="font-bold text-red-500 mt-6 mb-3 uppercase text-xs tracking-wider">Optimize PDF</h3>
                                            <ul className="space-y-2">
                                                {tools.optimize.map(tool => (
                                                    <li key={tool.to}>
                                                        <Link to={tool.to} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-3 group/item"><tool.icon className={`w-4 h-4 ${tool.color} transition-colors`} /><span>{tool.name}</span></Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-red-500 mb-3 uppercase text-xs tracking-wider">Convert to PDF</h3>
                                            <ul className="space-y-2">
                                                {tools.convertToPdf.map(tool => (
                                                    <li key={tool.to}>
                                                        <Link to={tool.to} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-3 group/item"><tool.icon className={`w-4 h-4 ${tool.color} transition-colors`} /><span>{tool.name}</span></Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-red-500 mb-3 uppercase text-xs tracking-wider">Convert from PDF</h3>
                                            <ul className="space-y-2">
                                                {tools.convertFromPdf.map(tool => (
                                                    <li key={tool.to}>
                                                        <Link to={tool.to} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-3 group/item"><tool.icon className={`w-4 h-4 ${tool.color} transition-colors`} /><span>{tool.name}</span></Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-red-500 mb-3 uppercase text-xs tracking-wider">Edit PDF</h3>
                                            <ul className="space-y-2">
                                                {tools.edit.map(tool => (
                                                    <li key={tool.to}>
                                                        <Link to={tool.to} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-3 group/item"><tool.icon className={`w-4 h-4 ${tool.color} transition-colors`} /><span>{tool.name}</span></Link>
                                                    </li>
                                                ))}
                                            </ul>
                                            <h3 className="font-bold text-red-500 mt-6 mb-3 uppercase text-xs tracking-wider">PDF Security</h3>
                                            <ul className="space-y-2">
                                                {tools.security.map(tool => (
                                                    <li key={tool.to}>
                                                        <Link to={tool.to} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-3 group/item"><tool.icon className={`w-4 h-4 ${tool.color} transition-colors`} /><span>{tool.name}</span></Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link to="/merge-pdf" className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Merge PDF
                            </Link>
                            <Link to="/split-pdf" className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Split PDF
                            </Link>
                            <Link to="/compress-pdf" className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Compress PDF
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <div className="bg-red-100 p-1.5 rounded-full">
                                        <User className="h-4 w-4 text-red-500" />
                                    </div>
                                    <span>{user.name}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-50 transition-colors"
                                    title="Log out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Login/Signup */}
                                <div className="hidden md:flex items-center space-x-2">
                                    <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium text-sm px-3 py-2">
                                        Log in
                                    </Link>
                                    <Link to="/signup" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow-md">
                                        Sign up
                                    </Link>
                                </div>

                                {/* Mobile Menu Button (Three Dots) */}
                                <div className="md:hidden relative">
                                    <button
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        className="p-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
                                        aria-label="Menu"
                                    >
                                        <MoreVertical className="h-6 w-6" />
                                    </button>

                                    {/* Mobile Dropdown Menu */}
                                    {isMobileMenuOpen && (
                                        <>
                                            {/* Backdrop to close menu when clicking outside */}
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            />

                                            {/* Dropdown */}
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                <Link
                                                    to="/login"
                                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-red-500 font-medium text-sm transition-colors"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    Log in
                                                </Link>
                                                <Link
                                                    to="/signup"
                                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-red-500 font-medium text-sm transition-colors border-t border-gray-100"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    Sign up
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
