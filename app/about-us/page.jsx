import React from 'react';
import Link from 'next/link';
import { Shield, Zap, Globe, Heart, Users, FileText, Lock, Smartphone } from 'lucide-react';

export const metadata = {
    title: 'About Us | SababPDF - Free Online PDF Tools',
    description: 'Learn about SababPDF, our mission to provide free, fast, and secure online PDF tools. Discover our story, values, and commitment to privacy and user experience.',
};

const values = [
    { icon: Shield, title: 'Privacy First', description: 'Your files are processed entirely in your browser. We never upload, store, or access your documents. What happens on your device stays on your device.' },
    { icon: Zap, title: 'Lightning Fast', description: 'Our tools are optimized for speed. Most operations complete in seconds, not minutes. No waiting in queues or watching progress bars.' },
    { icon: Globe, title: 'Accessible Everywhere', description: 'SababPDF works on any device with a modern web browser — Windows, Mac, Linux, iOS, Android, and Chromebook. No downloads or installations required.' },
    { icon: Heart, title: 'Truly Free', description: 'Our core tools are completely free with no hidden limits, no daily caps, and no forced account creation. We believe essential PDF tools should be available to everyone.' },
];

const tools = [
    { name: 'Merge PDF', href: '/merge-pdf', description: 'Combine multiple PDFs into one document' },
    { name: 'Split PDF', href: '/split-pdf', description: 'Extract specific pages from a PDF' },
    { name: 'Compress PDF', href: '/compress-pdf', description: 'Reduce PDF file size without quality loss' },
    { name: 'PDF to Word', href: '/pdf-to-word', description: 'Convert PDFs to editable Word documents' },
    { name: 'Word to PDF', href: '/word-to-pdf', description: 'Create PDFs from Word files' },
    { name: 'JPG to PDF', href: '/jpg-to-pdf', description: 'Convert images to PDF format' },
    { name: 'PDF to JPG', href: '/pdf-to-jpg', description: 'Extract images from PDF pages' },
    { name: 'Protect PDF', href: '/protect-pdf', description: 'Add password protection to PDFs' },
    { name: 'Unlock PDF', href: '/unlock-pdf', description: 'Remove password from PDFs' },
    { name: 'Rotate PDF', href: '/rotate-pdf', description: 'Fix page orientation permanently' },
    { name: 'Add Watermark', href: '/add-watermark', description: 'Add text or image watermarks' },
    { name: 'Crop PDF', href: '/crop-pdf', description: 'Trim margins and unwanted areas' },
];

const stats = [
    { label: 'PDF Tools', value: '20+' },
    { label: 'File Formats Supported', value: '10+' },
    { label: 'Countries Served', value: '190+' },
    { label: 'Files Uploaded to Servers', value: '0' },
];

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                        About SababPDF
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                        We are on a mission to make PDF tools free, fast, and private for everyone.
                        No uploads. No accounts. No limits.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-16">
                {/* Our Story */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                    <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
                        <p>
                            SababPDF was born out of frustration. We were tired of PDF tools that required software installations,
                            forced account creation, limited free usage, or — worst of all — uploaded our sensitive documents to unknown servers.
                        </p>
                        <p>
                            The site is built and maintained by an independent product team based in India, focused on practical document tools that stay simple and privacy-conscious.
                        </p>
                        <p>
                            We asked ourselves: <em>Why can't there be a PDF tool that just works — instantly, for free, and without
                                compromising privacy?</em> So we built one.
                        </p>
                        <p>
                            SababPDF processes all files directly in your web browser using modern JavaScript and WebAssembly technologies.
                            Your documents never leave your device. There are no file uploads, no cloud processing, and no data retention.
                            This architecture is not just a feature — it is the foundation of everything we build.
                        </p>
                        <p>
                            Today, SababPDF offers over 20 free tools covering everything from basic operations like merging and splitting
                            to advanced features like PDF comparison, redaction, and format conversion. We serve users in over 190 countries,
                            from students and freelancers to businesses and government agencies.
                        </p>
                    </div>
                </section>

                {/* Stats */}
                <section className="mb-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 text-center border border-purple-100">
                                <div className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-2">{stat.value}</div>
                                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Our Values */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <value.icon className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How We're Different */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Are Different</h2>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-purple-100">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <Lock className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">No Server Uploads</h3>
                                <p className="text-sm text-gray-600">Most PDF tools upload your files to their servers for processing. SababPDF processes everything in your browser. Your files never leave your device.</p>
                            </div>
                            <div className="text-center">
                                <Users className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">No Account Required</h3>
                                <p className="text-sm text-gray-600">We do not require registration, email verification, or account creation. Visit the site, use the tools, and leave. It is that simple.</p>
                            </div>
                            <div className="text-center">
                                <Smartphone className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">Works Everywhere</h3>
                                <p className="text-sm text-gray-600">Desktop, tablet, or phone. Chrome, Firefox, Safari, or Edge. SababPDF works on any modern browser on any device, with no plugins or extensions needed.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Tools */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Tools</h2>
                    <p className="text-gray-600 mb-8 text-lg">SababPDF offers a comprehensive suite of PDF tools, all free and all processing locally in your browser:</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tools.map((tool, index) => (
                            <Link key={index} href={tool.href} className="group p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
                                <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{tool.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Technology */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Technology</h2>
                    <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
                        <p>
                            SababPDF is built with modern web technologies that enable powerful document processing directly in the browser:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>PDF.js</strong>: Mozilla's open-source PDF rendering engine for accurate document display and manipulation</li>
                            <li><strong>pdf-lib</strong>: A JavaScript library for creating and modifying PDF documents programmatically</li>
                            <li><strong>Next.js</strong>: React framework for fast page loads, SEO optimization, and a smooth user experience</li>
                            <li><strong>Client-side Processing</strong>: All file operations run in your browser's JavaScript engine, ensuring complete privacy</li>
                        </ul>
                        <p>
                            This technology stack allows us to provide the same functionality as desktop PDF applications,
                            but delivered through a web browser with zero installation and maximum privacy.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                        <p className="text-gray-700 mb-4 text-lg">
                            We would love to hear from you. Whether you have a question, feature request, bug report, or just want to say hello,
                            please reach out. We read and respond to every message.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="mailto:sababpdf@gmail.com" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors">
                                <FileText className="w-5 h-5" />
                                sababpdf@gmail.com
                            </a>
                            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 border border-purple-200 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
                                Contact Form
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;
