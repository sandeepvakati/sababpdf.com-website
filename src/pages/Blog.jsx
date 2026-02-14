import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, FileText } from 'lucide-react';

const Blog = () => {
    const blogPosts = [
        {
            id: 1,
            title: "How to Merge PDF Files Online - Complete Guide 2026",
            slug: "how-to-merge-pdf-files-online",
            excerpt: "Learn how to combine multiple PDF files into one document quickly and securely using online tools. Step-by-step guide with tips.",
            date: "February 14, 2026",
            readTime: "5 min read",
            category: "Tutorials",
            image: "📄"
        },
        {
            id: 2,
            title: "Best Free PDF Tools in 2026: Complete Comparison",
            slug: "best-free-pdf-tools-2026",
            excerpt: "Discover the top free PDF tools for merging, splitting, compressing, and converting documents. Compare features, security, and ease of use.",
            date: "February 13, 2026",
            readTime: "8 min read",
            category: "Reviews",
            image: "⭐"
        },
        {
            id: 3,
            title: "PDF Security: How to Protect Your Documents",
            slug: "pdf-security-protect-documents",
            excerpt: "Essential guide to securing your PDF files with passwords, encryption, and watermarks. Protect sensitive information effectively.",
            date: "February 12, 2026",
            readTime: "6 min read",
            category: "Security",
            image: "🔒"
        },
        {
            id: 4,
            title: "Convert Word to PDF: The Ultimate Guide",
            slug: "convert-word-to-pdf-guide",
            excerpt: "Master the art of converting Word documents to PDF format. Learn about formatting, quality, and the best conversion methods.",
            date: "February 11, 2026",
            readTime: "5 min read",
            category: "Tutorials",
            image: "📝"
        },
        {
            id: 5,
            title: "Top 10 PDF Tips and Tricks for Productivity",
            slug: "top-10-pdf-tips-tricks",
            excerpt: "Boost your productivity with these essential PDF tips. From shortcuts to advanced features, become a PDF power user.",
            date: "February 10, 2026",
            readTime: "7 min read",
            category: "Tips",
            image: "💡"
        },
        {
            id: 6,
            title: "How to Compress PDF Files Without Losing Quality",
            slug: "compress-pdf-without-losing-quality",
            excerpt: "Reduce PDF file size while maintaining quality. Learn compression techniques, tools, and best practices for optimal results.",
            date: "February 9, 2026",
            readTime: "6 min read",
            category: "Tutorials",
            image: "🗜️"
        },
        {
            id: 7,
            title: "PDF vs PDF/A: Which Format Should You Use?",
            slug: "pdf-vs-pdfa-format-comparison",
            excerpt: "Understand the differences between PDF and PDF/A formats. Learn when to use each for archiving and long-term storage.",
            date: "February 8, 2026",
            readTime: "5 min read",
            category: "Guides",
            image: "📊"
        },
        {
            id: 8,
            title: "How to Add Watermarks to PDF Documents",
            slug: "how-to-add-watermarks-pdf",
            excerpt: "Protect your PDFs with custom watermarks. Step-by-step tutorial on adding text and image watermarks to your documents.",
            date: "February 7, 2026",
            readTime: "4 min read",
            category: "Tutorials",
            image: "🎨"
        },
        {
            id: 9,
            title: "Split PDF Files: Methods and Best Practices",
            slug: "split-pdf-files-methods",
            excerpt: "Learn different ways to split large PDF files into smaller documents. Extract pages, split by range, or separate by bookmarks.",
            date: "February 6, 2026",
            readTime: "5 min read",
            category: "Tutorials",
            image: "✂️"
        },
        {
            id: 10,
            title: "Excel to PDF Conversion: Complete Tutorial",
            slug: "excel-to-pdf-conversion-tutorial",
            excerpt: "Convert Excel spreadsheets to PDF format perfectly. Preserve formatting, charts, and layouts with our comprehensive guide.",
            date: "February 5, 2026",
            readTime: "6 min read",
            category: "Tutorials",
            image: "📈"
        },
        {
            id: 11,
            title: "PDF Accessibility: Making Documents for Everyone",
            slug: "pdf-accessibility-guide",
            excerpt: "Create accessible PDFs that everyone can read. Learn about tags, alt text, and compliance with accessibility standards.",
            date: "February 4, 2026",
            readTime: "7 min read",
            category: "Guides",
            image: "♿"
        },
        {
            id: 12,
            title: "How to Rotate PDF Pages Permanently",
            slug: "rotate-pdf-pages-permanently",
            excerpt: "Fix orientation issues in your PDFs. Learn how to rotate pages and save changes permanently with easy-to-follow steps.",
            date: "February 3, 2026",
            readTime: "4 min read",
            category: "Tutorials",
            image: "🔄"
        },
        {
            id: 13,
            title: "PowerPoint to PDF: Presentation Conversion Guide",
            slug: "powerpoint-to-pdf-conversion",
            excerpt: "Convert PowerPoint presentations to PDF format. Maintain animations, transitions, and quality in your exported files.",
            date: "February 2, 2026",
            readTime: "5 min read",
            category: "Tutorials",
            image: "📊"
        },
        {
            id: 14,
            title: "PDF Editing: Tools and Techniques Explained",
            slug: "pdf-editing-tools-techniques",
            excerpt: "Comprehensive guide to editing PDF documents. Learn about text editing, image manipulation, and page management.",
            date: "February 1, 2026",
            readTime: "8 min read",
            category: "Guides",
            image: "✏️"
        },
        {
            id: 15,
            title: "Batch Processing PDFs: Save Time and Effort",
            slug: "batch-processing-pdfs-guide",
            excerpt: "Process multiple PDF files simultaneously. Learn batch conversion, merging, and compression techniques for efficiency.",
            date: "January 31, 2026",
            readTime: "6 min read",
            category: "Tips",
            image: "⚡"
        }
    ];

    const categories = ["All", "Tutorials", "Guides", "Tips", "Security", "Reviews"];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        SababPDF Blog
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Tips, tutorials, and guides to help you master PDF tools and boost your productivity
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className="px-6 py-2 rounded-full bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Blog Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map((post) => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.slug}`}
                            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
                        >
                            {/* Icon/Image */}
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-12 flex items-center justify-center">
                                <span className="text-6xl">{post.image}</span>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Category Badge */}
                                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-3">
                                    {post.category}
                                </span>

                                {/* Title */}
                                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>

                                {/* Excerpt */}
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {post.readTime}
                                        </span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
                    <FileText className="h-16 w-16 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Try Our PDF Tools?
                    </h2>
                    <p className="text-lg mb-6 opacity-90">
                        Free, fast, and secure PDF tools for all your document needs
                    </p>
                    <Link
                        to="/"
                        className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Explore Tools
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Blog;
