import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        // For now, we'll use mailto as a simple solution
        // You can replace this with a backend API later
        const mailtoLink = `mailto:contact@sababpdf.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
            `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
        )}`;

        window.location.href = mailtoLink;

        setStatus({
            type: 'success',
            message: 'Your email client will open. Please send the email to complete your message.'
        });

        setIsSubmitting(false);

        // Reset form
        setTimeout(() => {
            setFormData({ name: '', email: '', subject: '', message: '' });
            setStatus({ type: '', message: '' });
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have questions, feedback, or need help? We'd love to hear from you!
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="How can we help?"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>

                            {/* Status Message */}
                            {status.message && (
                                <div className={`flex items-center gap-2 p-4 rounded-lg ${status.type === 'success'
                                        ? 'bg-green-50 text-green-800'
                                        : 'bg-red-50 text-red-800'
                                    }`}>
                                    {status.type === 'success' ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5" />
                                    )}
                                    <p className="text-sm">{status.message}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                        {/* Email Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Mail className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                                    <p className="text-gray-600 mb-2">
                                        For general inquiries and support
                                    </p>
                                    <a
                                        href="mailto:contact@sababpdf.com"
                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        contact@sababpdf.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Card */}
                        <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Frequently Asked Questions
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Is SababPDF free to use?
                                    </h4>
                                    <p className="text-gray-700 text-sm">
                                        Yes! All our PDF tools are completely free with no hidden charges.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Is my data secure?
                                    </h4>
                                    <p className="text-gray-700 text-sm">
                                        Absolutely! All processing happens in your browser. We don't store your files.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        How can I report a bug?
                                    </h4>
                                    <p className="text-gray-700 text-sm">
                                        Use the contact form above or email us directly with details about the issue.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Response Time */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                            <p className="text-gray-600 text-sm">
                                ⏱️ We typically respond within <span className="font-semibold text-gray-900">24-48 hours</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
