import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, Share2, FileText } from 'lucide-react';

// Pre-define blog metadata and articles outside component for dynamic generation
const articles = {
    "how-to-merge-pdf-files-online": {
        title: "How to Merge PDF Files Online - Complete Guide 2026",
        date: "February 14, 2026",
        readTime: "5 min read",
        category: "Tutorials",
        excerpt: "Learn how to combine multiple PDF files into one document quickly and securely using online tools. Step-by-step guide with tips.",
        content: `
# How to Merge PDF Files Online - Complete Guide 2026

Merging PDF files is one of the most common document tasks. Whether you're combining invoices, reports, or presentations, knowing how to merge PDFs efficiently can save you time and hassle.

## Why Merge PDF Files?

- **Organization**: Combine related documents into one file
- **Sharing**: Send one file instead of multiple attachments
- **Archiving**: Keep all project documents together
- **Professional**: Present a unified document to clients

## How to Merge PDFs with SababPDF

### Step 1: Upload Your Files
1. Go to [SababPDF Merge Tool](/merge-pdf)
2. Click "Select PDF Files" or drag and drop
3. Add 2 or more PDF files

### Step 2: Arrange the Order
- Drag files to reorder them
- Preview each document
- Remove any unwanted files

### Step 3: Merge and Download
1. Click "Merge PDF" button
2. Wait for processing (usually instant)
3. Download your combined PDF

## Best Practices for Merging PDFs

### 1. Check File Sizes
Large files take longer to merge. Consider compressing PDFs first if they're over 10MB.

### 2. Maintain Logical Order
Arrange documents in a sequence that makes sense:
- Chronological order for reports
- Table of contents first
- Appendices last

### 3. Use Descriptive Filenames
Name your merged PDF clearly:
- ✅ "Q1_2026_Financial_Report.pdf"
- ❌ "merged_document_final_v2.pdf"

## Security Considerations

When merging PDFs online:
- **Use HTTPS**: Ensure the website uses secure connections
- **Client-side Processing**: Tools like SababPDF process files in your browser
- **No Upload**: Your files never leave your device
- **Delete After**: Clear browser cache if using public computers

## Common Issues and Solutions

### Problem: Files Won't Merge
**Solution**: Check if PDFs are password-protected. Unlock them first.

### Problem: Merged PDF is Too Large
**Solution**: Compress the merged PDF or reduce image quality in source files.

### Problem: Pages Are Out of Order
**Solution**: Rearrange files before merging. Most tools allow drag-and-drop reordering.

## Alternative Methods

### Desktop Software
- Adobe Acrobat DC (paid)
- PDFtk (free, command-line)
- Preview on Mac (built-in)

### Online Tools
- SababPDF (free, no upload)
- iLovePDF (free with limits)
- Smallpdf (freemium)

## Conclusion

Merging PDFs doesn't have to be complicated. With tools like SababPDF, you can combine documents in seconds without compromising security or quality.

**Ready to merge your PDFs?** [Try SababPDF Merge Tool](/merge-pdf) - it's free, fast, and secure!
        `
    },
    // ... we can add all other articles here or fetch them from a CMS, but for simplicity we embed the main ones or just read from a single struct
    "best-free-pdf-tools-2026": {
        title: "Best Free PDF Tools in 2026: Complete Comparison",
        date: "February 13, 2026",
        readTime: "8 min read",
        category: "Reviews",
        excerpt: "Discover the top free PDF tools for merging, splitting, compressing, and converting documents.",
        content: `# Best Free PDF Tools in 2026: Complete Comparison\n\nFinding the right PDF tool can be overwhelming. Here is our comparison.`
    }
};

// Next.js `generateMetadata` for dynamic SEO
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = articles[slug];

    if (article) {
        return {
            title: `${article.title} | SababPDF Blog`,
            description: article.excerpt || `Read about ${article.title} on the SababPDF Blog.`,
        };
    }

    return {
        title: 'Blog Post Not Found | SababPDF',
        description: 'The requested blog post could not be found.'
    };
}

// Next.js `generateStaticParams` for pre-rendering blog pages
export async function generateStaticParams() {
    return Object.keys(articles).map((slug) => ({
        slug,
    }));
}

const BlogPost = async ({ params }) => {
    const { slug } = await params;
    const article = articles[slug] || {
        title: "Article Not Found",
        date: "",
        readTime: "",
        category: "",
        content: `Sorry, the article you're looking for doesn't exist but here's a generic page.`
    };

    if (article.title === "Article Not Found") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
                <Link href="/blog" className="text-blue-600 hover:underline">Return to Blog</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 pt-20 pb-16 px-4">
                <div className="max-w-3xl mx-auto text-center border-b border-gray-200 pb-12">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to all articles
                    </Link>

                    <div className="mb-6 flex justify-center">
                        <span className="px-4 py-1.5 bg-white text-purple-700 rounded-full text-sm font-bold shadow-sm border border-purple-100 uppercase tracking-wide">
                            {article.category}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-center gap-6 text-gray-600 font-medium">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            {article.date}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-400" />
                            {article.readTime}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
                {/* Social Share / Sidebar */}
                <div className="lg:w-16 flex-shrink-0">
                    <div className="sticky top-24 flex flex-col items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hidden lg:flex">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Share</span>
                        <button className="p-3 bg-white text-gray-500 hover:text-blue-500 rounded-xl hover:bg-blue-50 transition-all shadow-sm border border-gray-100 group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                        </button>
                        <button className="p-3 bg-white text-gray-500 hover:text-blue-700 rounded-xl hover:bg-blue-50 transition-all shadow-sm border border-gray-100 group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                        </button>
                        <button className="p-3 bg-white text-gray-500 hover:text-green-600 rounded-xl hover:bg-green-50 transition-all shadow-sm border border-gray-100 group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                        </button>
                    </div>
                </div>

                {/* Article Content */}
                <article className="prose prose-lg prose-purple max-w-3xl mx-auto md:mx-0 w-full prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-purple-600 hover:prose-a:text-purple-700 prose-img:rounded-2xl prose-img:shadow-lg prose-p:text-gray-700 prose-li:text-gray-700">
                    {/* Simulated Markdown Renderer */}
                    <div dangerouslySetInnerHTML={{
                        __html: article.content
                            .replace(/^# (.*$)/gim, '') // Remove H1 since we render it in the header
                            .replace(/^## (.*$)/gim, '<h2 class="mt-12 mb-6 pb-2 border-b border-gray-100">$1</h2>')
                            .replace(/^### (.*$)/gim, '<h3 class="mt-8 mb-4">$1</h3>')
                            .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg italic my-6">$1</blockquote>')
                            .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-gray-900">$1</strong>')
                            .replace(/\*(.*)\*/gim, '<em>$1</em>')
                            .replace(/`([^`]*)`/gim, '<code class="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-sm">$1</code>')
                            .replace(/\n\n/gim, '</p><p class="mb-6 leading-relaxed">')
                            .replace(/^((?:- .*\n)+)/gim, '<ul class="list-disc pl-6 mb-8 space-y-2">$&</ul>')
                            .replace(/^- (.*)/gim, '<li>$1</li>')
                            .replace(/^((?:\d+\. .*\n)+)/gim, '<ol class="list-decimal pl-6 mb-8 space-y-2">$&</ol>')
                            .replace(/^\d+\. (.*)/gim, '<li>$1</li>')
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="font-medium underline decoration-purple-200 underline-offset-4 hover:decoration-purple-500 transition-colors">$1</a>')
                    }} />

                    {/* Mobile Share (Bottom) */}
                    <div className="lg:hidden mt-12 py-6 border-t border-b border-gray-100 flex items-center justify-center gap-4">
                        <span className="font-semibold text-gray-500 mr-2 border-r border-gray-200 pr-4">Share this article</span>
                        <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557...z" /></svg></button>
                        <button className="p-2 text-gray-400 hover:text-blue-700 transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c...z" /></svg></button>
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24...z" /></svg></button>
                    </div>
                </article>

                {/* Right Sidebar - Related Content CTA */}
                <div className="hidden xl:block w-72 flex-shrink-0">
                    <div className="sticky top-24 bg-gradient-to-b from-blue-50 to-purple-50 rounded-3xl p-6 border border-purple-100 shadow-sm text-center">
                        <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-purple-600">
                            <FileText className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Try SababPDF Tools</h3>
                        <p className="text-sm text-gray-600 mb-6 font-medium">100% Free, Secure, and fast PDF processing online.</p>
                        <Link href="/" className="block w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-bold shadow-md hover:bg-purple-700 transition-all hover:-translate-y-0.5">
                            Explore Tools Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom CTA for all screens */}
            <div className="bg-gray-900 text-white py-16 px-4 text-center mt-8">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">Did you find this helpful?</h2>
                    <p className="text-gray-400 text-lg mb-8">SababPDF offers 20+ free tools to handle all your PDF problems. No registration required.</p>
                    <Link href="/" className="inline-block py-4 px-8 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl">
                        Start Processing Files
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
