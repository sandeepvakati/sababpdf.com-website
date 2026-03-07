import React from 'react';

export const metadata = {
    title: 'Terms of Service | SababPDF',
    description: 'Terms of Service for using SababPDF.',
};

const TermsOfService = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <p className="mb-4 text-gray-600">Last updated: March 5, 2026</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing and using SababPDF ("we," "our," or "us"), you agree to be bound by these Terms of Service.
                    If you do not agree to these terms, please do not use our website or services.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
                <p className="mb-4">
                    SababPDF provides free online PDF tools that allow users to merge, split, compress, convert, and manipulate PDF documents. All processing is typically done client-side within the browser to ensure the privacy of your files.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
                <p className="mb-4">
                    You are solely responsible for the files you process using our tools. You agree not to use SababPDF to process files that contain illegal content, malware, or anything that violates the intellectual property rights of others.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Prohibited Uses</h2>
                <p className="mb-4">
                    You agree not to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Use the service for any illegal or unauthorized purpose.</li>
                    <li>Attempt to disrupt, damage, or interfere with any part of the website or its infrastructure.</li>
                    <li>Use automated scripts or bots to access or manipulate the service without our permission.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Disclaimer of Warranties</h2>
                <p className="mb-4">
                    THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                <p className="mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, SABABPDF SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; OR (C) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
                <p className="mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
                <p className="mb-4">
                    If you have any questions about these Terms of Service, please contact us at: <a href="mailto:sababpdf@gmail.com" className="text-blue-600 hover:underline">sababpdf@gmail.com</a>
                    <br />
                    Region: India.
                </p>
            </section>
        </div>
    );
};

export default TermsOfService;
