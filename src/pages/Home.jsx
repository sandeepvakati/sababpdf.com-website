import FeatureCard from '../components/FeatureCard';
import { Layers, Scissors, Minimize2 } from 'lucide-react';

const tools = [
    {
        title: 'Merge PDF',
        description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
        icon: Layers,
        to: '/merge-pdf',
        color: 'text-red-500',
    },
    {
        title: 'Split PDF',
        description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
        icon: Scissors,
        to: '/split-pdf',
        color: 'text-green-500',
    },
    {
        title: 'Compress PDF',
        description: 'Reduce file size while optimizing for maximal PDF quality.',
        icon: Minimize2,
        to: '/compress-pdf',
        color: 'text-blue-500',
    },
];

const Home = () => {
    return (
        <div className="bg-gray-50 py-16 flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        Every tool you need to work with PDFs in one place
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                        Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((tool) => (
                        <FeatureCard key={tool.title} {...tool} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
