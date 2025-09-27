import { File, Code, Palette, Database } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { FileContents } from '@/hooks/useFileManagement';

interface FileEditorProps {
  fileContents: FileContents;
  activeFile: string;
  onActiveFileChange: (filename: string) => void;
  onFileContentChange: (filename: string, content: string) => void;
}

const fileConfigs = {
  'index.html': { icon: File, language: 'html' },
  'styles.css': { icon: Palette, language: 'css' },
  'script.js': { icon: Code, language: 'javascript' },
  'db.json': { icon: Database, language: 'json' },
} as const;

/**
 * File editor component with tabs for different file types
 */
export function FileEditor({ 
  fileContents, 
  activeFile, 
  onActiveFileChange, 
  onFileContentChange 
}: FileEditorProps) {
  const getFileIcon = (filename: string) => {
    const IconComponent = fileConfigs[filename as keyof typeof fileConfigs]?.icon || File;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* File Tabs */}
      <Tabs value={activeFile} onValueChange={onActiveFileChange} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 h-12 m-4">
          {Object.keys(fileContents).map((filename) => (
            <TabsTrigger
              key={filename}
              value={filename}
              className="flex items-center gap-2"
              data-testid={`tab-${filename}`}
            >
              {getFileIcon(filename)}
              <span className="hidden sm:inline">{filename}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* File Content Editor */}
        <div className="flex-1 px-4 pb-4">
          {Object.entries(fileContents).map(([filename, content]) => (
            <TabsContent key={filename} value={filename} className="h-full">
              <div className="h-full border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                  <div className="flex items-center gap-2">
                    {getFileIcon(filename)}
                    <span className="font-medium text-sm">{filename}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {fileConfigs[filename as keyof typeof fileConfigs]?.language}
                  </span>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => onFileContentChange(filename, e.target.value)}
                  className="h-full min-h-[400px] border-0 rounded-none resize-none font-mono text-sm"
                  placeholder={`Enter your ${filename} code here...`}
                  data-testid={`editor-${filename}`}
                />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}