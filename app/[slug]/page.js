import { notFound } from 'next/navigation';
import ToolPageClient from './ToolPageClient';
import { ALL_TOOLS, getToolById } from '../../lib/toolsList';

export const dynamicParams = false;

function buildMetadata(tool) {
  return {
    title: tool.title,
    description: `${tool.description} Use the ${tool.title} tool on SababPDF with a clear workflow and transparent file-handling notes.`,
    alternates: {
      canonical: `https://sababpdf.com${tool.href}`,
    },
  };
}



export async function generateMetadata({ params }) {
  const tool = getToolById(params.slug);
  return tool ? buildMetadata(tool) : {};
}

export function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({
    slug: tool.id,
  }));
}

export default function ToolPage({ params }) {
  const tool = getToolById(params.slug);
  if (!tool) {
    notFound();
  }

  return <ToolPageClient tool={tool} />;
}
