import React from 'react';

export const metadata = {
    title: 'Privacy Policy | SababPDF',
    description: 'Read how SababPDF collects, uses, and protects data, including cookies and Google AdSense disclosures.',
};

const LAST_UPDATED = 'March 5, 2026';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-8 text-gray-600">Last updated: {LAST_UPDATED}</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Contact details:</strong> Name and email address when you submit our contact form.</li>
                    <li><strong>Usage data:</strong> IP address, browser/device details, pages visited, and session events for analytics and security.</li>
                    <li><strong>Uploaded files:</strong> Files are processed for the requested tool operation and not retained longer than necessary.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Data</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Provide PDF conversion, editing, and optimization services.</li>
                    <li>Respond to support requests and contact messages.</li>
                    <li>Improve site reliability, performance, and user experience.</li>
                    <li>Prevent abuse, fraud, and security incidents.</li>
                    <li>Comply with legal obligations.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Cookies and Similar Technologies</h2>
                <p className="mb-4 text-gray-700">We use cookies and local storage for:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Essential cookies:</strong> Core functionality and security.</li>
                    <li><strong>Preferences cookies:</strong> Remembering choices like cookie consent.</li>
                    <li><strong>Analytics cookies:</strong> Understanding site usage and performance.</li>
                    <li><strong>Advertising cookies:</strong> Personalizing and measuring ads.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Advertising Disclosure (Google AdSense)</h2>
                <p className="text-gray-700">
                    We use Google AdSense to display advertisements. Google AdSense uses cookies
                    to serve ads based on your prior visits to this website or other websites.
                    You may opt out of personalized advertising by visiting Google's Ads Settings
                    at <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline"> https://www.google.com/settings/ads</a>.
                    We also participate in Google's EU User Consent Policy for users in the European Economic Area.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
                <p className="mb-4 text-gray-700">We may rely on third-party providers, including:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Google AdSense (advertising).</li>
                    <li>Google Analytics or equivalent analytics tools.</li>
                    <li>Vercel or similar hosting and infrastructure services.</li>
                    <li>Resend or similar transactional email providers (contact form delivery).</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. User Rights (GDPR/CCPA)</h2>
                <p className="mb-4 text-gray-700">Depending on your location, you may have rights to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Request access to personal data we hold about you.</li>
                    <li>Request correction or deletion of personal data.</li>
                    <li>Object to or restrict certain data processing.</li>
                    <li>Request portability of personal data where applicable.</li>
                    <li>Opt out of the sale/sharing of personal information where required by law.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention and Security</h2>
                <p className="text-gray-700">
                    We implement reasonable technical and organizational safeguards. No internet-based
                    service can guarantee absolute security. We retain personal information only for as long
                    as required to provide services, resolve disputes, and comply with legal obligations.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
                <p className="text-gray-700">
                    For privacy questions or requests, contact us at{' '}
                    <a href="mailto:sababpdf@gmail.com" className="text-blue-600 hover:underline">sababpdf@gmail.com</a>.
                    <br />
                    Region: India.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
