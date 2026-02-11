import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description, icon: Icon, to, color }) => {
    return (
        <Link to={to} className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:-translate-y-1 block h-full">
            <div className="flex flex-col h-full bg-white">
                <div className={`mb-6 p-3 rounded-full bg-gray-50 w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-500 transition-colors">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
                <div className="mt-auto pt-6 flex items-center text-red-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    <span>Open Tool</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
            </div>
        </Link>
    );
};

export default FeatureCard;
