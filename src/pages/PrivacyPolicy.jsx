import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4">
                    Welcome to SababPDF ("we," "our," or "us"). We are committed to protecting your privacy
                    and your personal data. This Privacy Policy explains how we collect, use, and protect your
                    information when you visit our website sababpdf.com.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                <p className="mb-4">
                    We may collect the following types of information:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li><strong>Personal Information:</strong> When you register or contact us, we may collect your name and email address.</li>
                    <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our service, such as IP address, browser type, and pages visited.</li>
                    <li><strong>Files:</strong> Files you upload for processing are temporarily stored solely for the purpose of performing the requested operation and are automatically deleted shortly thereafter.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="mb-4">
                    We use your information to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Provide and maintain our PDF tools.</li>
                    <li>Improve user experience and website performance.</li>
                    <li>Communicate with you regarding updates or support.</li>
                    <li>Comply with legal obligations.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Advertising and Analytics</h2>
                <p className="mb-4">
                    We use third-party services such as Google AdSense and Google Analytics. These services may use cookies
                    and similar technologies to collect data about your browsing behavior to show personalized ads and analyze
                    website traffic. You can opt-out of personalized advertising by visiting Google's Ad Settings.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                <p className="mb-4">
                    We implement appropriate technical and organizational measures to protect your data. However,
                    please note that no method of transmission over the internet is 100% secure.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about this Privacy Policy, please contact us at: sababpdf@email.com
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
