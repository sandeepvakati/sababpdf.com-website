'use client';
import { useState } from 'react';
import { ChevronDown, CheckCircle, Lightbulb, HelpCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-800 pr-4">{question}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-5 pt-1 bg-gray-50 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    );
};

export default function ToolPageContent({
    title,
    howToUse,
    whyUseThis,
    tips,
    faqs,
    relatedTools,
}) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
            {/* How to Use Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2.5 rounded-xl">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        How to {title}
                    </h2>
                </div>
                <div className="space-y-4">
                    {howToUse.map((step, index) => (
                        <div key={index} className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="pt-1">
                                <h3 className="font-semibold text-gray-800 text-lg">{step.title}</h3>
                                <p className="text-gray-600 mt-1 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Use This Tool */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-100 p-2.5 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Why Use SababPDF to {title}?
                    </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    {whyUseThis.map((reason, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <h3 className="font-semibold text-gray-800 mb-2">{reason.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{reason.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tips and Best Practices */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-amber-100 p-2.5 rounded-xl">
                        <Lightbulb className="h-6 w-6 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Tips & Best Practices
                    </h2>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <ul className="space-y-3">
                        {tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="text-amber-500 font-bold mt-0.5">💡</span>
                                <p className="text-gray-700 leading-relaxed">{tip}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* FAQ Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-2.5 rounded-xl">
                        <HelpCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <FaqItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </section>

            {/* Related Tools */}
            {relatedTools && relatedTools.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Related PDF Tools You Might Need
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {relatedTools.map((tool, index) => (
                            <Link
                                key={index}
                                href={tool.href}
                                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all group"
                            >
                                <span className="text-2xl block mb-2">{tool.icon}</span>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{tool.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
