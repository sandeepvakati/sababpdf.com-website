import Navbar from './Navbar';
import Footer from './Footer';
import BetaNotice from './BetaNotice';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-white">
            <BetaNotice />
            <Navbar />
            <main className="flex-grow flex flex-col">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
