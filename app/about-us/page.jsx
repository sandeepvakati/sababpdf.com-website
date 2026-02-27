import React from 'react';

export const metadata = {
    title: 'About Us | SababPDF',
    description: 'Learn about SababPDF, our mission, and why we created a suite of free, fast, and easy-to-use online PDF tools for everyone.',
};

const AboutUs = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">About Us</h1>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="mb-4 text-lg text-gray-700">
                    At <strong className="font-semibold text-gray-900">SababPDF</strong>, our mission is simple: to make PDF tools accessible, fast, and easy to use for everyone.
                    We believe that managing documents shouldn't be a hassle or require expensive software.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
                <p className="mb-4 text-gray-600">
                    SababPDF offers a suite of online tools designed to help you handle your PDF files with efficiency.
                    Whether you need to <strong className="font-semibold text-gray-800">merge</strong> multiple documents into one, <strong className="font-semibold text-gray-800">split</strong> a large file into smaller parts,
                    or <strong className="font-semibold text-gray-800">compress</strong> a PDF for easier sharing, we have the right tool for you.
                </p>
                <p className="mb-4 text-gray-600">
                    Our platform is completely web-based, meaning you can access our tools from any device, anywhere in the world,
                    without installing any software created by developers who are passionate about productivity and user experience.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong className="text-gray-900">Free & Easy:</strong> Our core tools are free to use with a user-friendly interface.</li>
                    <li><strong className="text-gray-900">Secure:</strong> We prioritize your privacy and ensure your files are handled securely.</li>
                    <li><strong className="text-gray-900">Fast:</strong> Our optimized processing engine ensures your tasks are completed in seconds.</li>
                    <li><strong className="text-gray-900">No Installation:</strong> Works directly in your browser.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="mb-4 text-gray-600">
                    We value your feedback and are always looking to improve. If you have any suggestions, questions, or issues,
                    please feel free to reach out to our team.
                </p>
                <p className="font-medium">
                    Email: <a href="mailto:sababpdf@gmail.com" className="text-blue-600 hover:underline">sababpdf@gmail.com</a>
                </p>
            </section>
        </div>
    );
};

export default AboutUs;
