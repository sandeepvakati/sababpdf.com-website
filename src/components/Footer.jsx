import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} SababPDF. All rights reserved.
                        </p>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <span>Made with</span>
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                        <span>for PDF lovers</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
