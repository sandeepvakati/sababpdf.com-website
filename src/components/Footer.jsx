import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex space-x-6">
                        <a href="/about-us" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">About Us</a>
                        <a href="/privacy-policy" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">Privacy Policy</a>
                        <a href="/terms-of-service" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">Terms of Service</a>
                    </div>

                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-sm text-gray-400">
                        <p>
                            © {new Date().getFullYear()} SababPDF. All rights reserved.
                        </p>
                        <div className="hidden md:block w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center space-x-1">
                            <span>Made with</span>
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                            <span>for PDF lovers</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
