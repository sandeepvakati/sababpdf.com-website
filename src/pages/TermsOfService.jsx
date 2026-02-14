import React from 'react';

const TermsOfService = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <p className="mb-4 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing and using SababPDF ("the Service"), you agree to be bound by these Terms of Service.
                    If you do not agree to these terms, please do not use our Service.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
                <p className="mb-4">
                    SababPDF provides online PDF tools for merging, splitting, compressing, and converting documents.
                    You agree to use the Service only for lawful purposes and in accordance with these Terms.
                </p>
                <p className="mb-4">
                    You are responsible for the content of the files you upload and process. You must not upload files that
                    contain illegal, harmful, or malicious content.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Intellectual Property</h2>
                <p className="mb-4">
                    The Service and its original content, features, and functionality are owned by SababPDF and are
                    protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p className="mb-4">
                    We do not claim ownership of the files you process using our Service. You retain all rights to your documents.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Disclaimer of Warranties</h2>
                <p className="mb-4">
                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied,
                    regarding the reliability, accuracy, or availability of the Service. We do not guarantee that the Service
                    will be uninterrupted or error-free.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
                <p className="mb-4">
                    In no event shall SababPDF be liable for any indirect, incidental, special, consequential, or punitive damages,
                    including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from
                    your use of the Service.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Changes to Terms</h2>
                <p className="mb-4">
                    We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant
                    changes by posting the new Terms on this page.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about these Terms, please contact us at: sababpdf@email.com
                </p>
            </section>
        </div>
    );
};

export default TermsOfService;
