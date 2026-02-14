import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description, icon: Icon, to, color }) => {
    return (
        <Link to={to} className="group bg-white p-4 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-black block h-full">
            <div className="flex flex-row md:flex-col h-full items-center md:items-start gap-4 md:gap-3">
                <div className={`p-3 rounded-2xl w-fit shrink-0 group-hover:scale-110 transition-transform duration-300 ${color}`}>
                    <Icon className={`h-6 w-6 md:h-8 md:w-8 text-white`} />
                </div>
                <div className="flex-grow">
                    <h3 className="text-base md:text-2xl font-bold text-gray-900 mb-1 md:mb-3">{title}</h3>
                    <p className="text-gray-500 leading-relaxed text-xs md:text-base line-clamp-2 md:line-clamp-none">{description}</p>
                </div>
            </div>
        </Link>
    );
};

export default FeatureCard;
