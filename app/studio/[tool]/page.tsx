import { notFound } from 'next/navigation';
import ToolSwitcher from '@/components/dashboard/tool-switcher';

// Define the structure for Next.js 15 params
interface PageProps {
  params: Promise<{ tool: string }>;
}

export default async function ToolPage({ params }: PageProps) {
  // 1. Await the params to get the tool name as per Next.js 15 requirements
  const { tool } = await params;

  // 2. Simple guard: if the tool slug is missing
  if (!tool) {
    return notFound();
  }

  return (
    <main className="h-screen w-full bg-black overflow-hidden">
      {/* ToolSwitcher is a Client Component. 
          It will consume the useFileStore hook internally 
          to pass the preloaded file to the correct tool.
      */}
      <ToolSwitcher toolSlug={tool} />
    </main>
  );
}

// 3. Static Params for instant loading performance
export async function generateStaticParams() {
  return [
    { tool: 'audio-transcriber' },
    { tool: 'video-converter' },
    { tool: 'audio-cutter' },
    { tool: 'pdf-tools' },
    { tool: 'vault' },
    { tool: 'magic-remover' },
  ];
}