import { Link } from 'react-router-dom';
import { FileText, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-red-500 p-1.5 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-2xl text-gray-900 tracking-tight">
                                Sabab<span className="text-red-500 font-light">PDF</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/" className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            All Tools
                        </Link>
                        <div className="hidden md:flex space-x-2">
                            <Link to="/merge-pdf" className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Merge
                            </Link>
                            <Link to="/split-pdf" className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Split
                            </Link>
                            <Link to="/compress-pdf" className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Compress
                            </Link>
                        </div>

                        <div className="flex items-center space-x-3 ml-4 border-l border-gray-200 pl-4">
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
                                    <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                                        Log in
                                    </Link>
                                    <Link to="/signup" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md">
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
