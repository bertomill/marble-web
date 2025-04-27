'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  File, 
  FilePlus, 
  Check 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from "@/components/ui/use-toast";

interface FileData {
  content: string;
  language: string;
  lastModified?: Date | number;
}

interface FileExplorerProps {
  files: Record<string, FileData>;
  onFileSelect: (fileName: string) => void;
  onFileCreate?: (fileName: string, content: string, language: string) => void;
  selectedFile: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  selectedFile
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Handle file creation
  const handleCreateFile = () => {
    if (!newFileName) {
      toast({
        title: "Error",
        description: "File name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file name
    if (!/^[\w\-. ]+$/.test(newFileName)) {
      toast({
        title: "Error",
        description: "Invalid file name. Use only letters, numbers, underscores, hyphens, spaces and dots.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if file already exists
    if (files[newFileName]) {
      toast({
        title: "Error",
        description: "A file with this name already exists",
        variant: "destructive"
      });
      return;
    }
    
    // Determine language from file extension
    const extension = newFileName.split('.').pop()?.toLowerCase() || '';
    let language = 'plaintext';
    
    switch (extension) {
      case 'js':
        language = 'javascript';
        break;
      case 'jsx':
        language = 'javascript';
        break;
      case 'ts':
        language = 'typescript';
        break;
      case 'tsx':
        language = 'typescript';
        break;
      case 'html':
        language = 'html';
        break;
      case 'css':
        language = 'css';
        break;
      case 'json':
        language = 'json';
        break;
      case 'md':
        language = 'markdown';
        break;
      default:
        language = 'plaintext';
    }
    
    // Create empty content for the new file
    const content = '';
    
    // Call the onFileCreate callback if it exists
    if (onFileCreate) {
      onFileCreate(newFileName, content, language);
    }
    
    // Reset state
    setNewFileName('');
    setIsCreatingFile(false);
  };

  return (
    <div className="h-full p-3 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-sm">Files</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          onClick={() => setIsCreatingFile(true)}
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>
      
      {isCreatingFile && (
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <Input 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.ext"
              className="text-xs h-7 mr-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setIsCreatingFile(false);
              }}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={handleCreateFile}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            Press Enter to create file
          </p>
        </div>
      )}
      
      <div className="mt-2 space-y-1">
        {Object.keys(files).map((fileName) => (
          <div 
            key={fileName}
            className={`flex items-center py-1 px-2 rounded text-sm ${
              selectedFile === fileName ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-zinc-100'
            }`}
            onClick={() => onFileSelect(fileName)}
          >
            <File className="h-4 w-4 mr-2" />
            <span>{fileName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer; 