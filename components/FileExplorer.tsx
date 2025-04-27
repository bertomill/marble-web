'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  File, 
  FilePlus, 
  FolderPlus, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from "@/components/ui/use-toast";

interface FileEntry {
  name: string;
  language: string;
  lastModified: Date | number;
}

interface FolderEntry {
  name: string;
  children: Record<string, FileSystemEntry>;
}

type FileSystemEntry = FileEntry | FolderEntry;

interface FileExplorerProps {
  files: Record<string, FileEntry>;
  onFileSelect: (fileName: string) => void;
  onFileCreate?: (fileName: string, content: string, language: string) => void;
  onFileDelete?: (fileName: string) => void;
  onFileRename?: (oldName: string, newName: string) => void;
  selectedFile: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  selectedFile
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isRenamingFile, setIsRenamingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Create file system structure with virtual folders based on file paths
  const createFileSystem = (files: Record<string, FileEntry>) => {
    const fileSystem: Record<string, FileSystemEntry> = {};
    
    Object.entries(files).forEach(([path, fileInfo]) => {
      const parts = path.split('/');
      let currentLevel = fileSystem;
      
      // If it's a direct file (no slashes)
      if (parts.length === 1) {
        currentLevel[path] = fileInfo;
        return;
      }
      
      // Create folder structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!currentLevel[part]) {
          currentLevel[part] = { name: part, children: {} };
        }
        
        // Move down to next level
        const entry = currentLevel[part] as FolderEntry;
        currentLevel = entry.children;
      }
      
      // Add the file at the last level
      const fileName = parts[parts.length - 1];
      currentLevel[fileName] = { 
        ...fileInfo,
        name: fileName
      };
    });
    
    return fileSystem;
  };

  const fileSystem = createFileSystem(files);

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

  // Handle file rename
  const handleRenameFile = () => {
    if (!isRenamingFile || !newName) {
      setIsRenamingFile(null);
      setNewName('');
      return;
    }
    
    // Validate new name
    if (!/^[\w\-. ]+$/.test(newName)) {
      toast({
        title: "Error",
        description: "Invalid file name. Use only letters, numbers, underscores, hyphens, spaces and dots.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if a file with new name already exists
    if (isRenamingFile !== newName && files[newName]) {
      toast({
        title: "Error",
        description: "A file with this name already exists",
        variant: "destructive"
      });
      return;
    }
    
    // Call the onFileRename callback if it exists
    if (onFileRename) {
      onFileRename(isRenamingFile, newName);
    }
    
    // Reset state
    setIsRenamingFile(null);
    setNewName('');
  };

  // Recursively render file system entries
  const renderFileSystemEntry = (entry: FileSystemEntry, key: string, path: string = '') => {
    const fullPath = path ? `${path}/${key}` : key;
    
    // If it's a file
    if ('language' in entry) {
      return (
        <div 
          key={fullPath}
          className={`flex items-center py-1 px-2 rounded text-sm mb-1 ${
            selectedFile === fullPath ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-zinc-100'
          }`}
        >
          {isRenamingFile === fullPath ? (
            <div className="flex items-center w-full">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-6 py-0 text-xs mr-1"
                autoFocus
                onBlur={handleRenameFile}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFile();
                  if (e.key === 'Escape') {
                    setIsRenamingFile(null);
                    setNewName('');
                  }
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleRenameFile}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <File className="h-4 w-4 mr-2 flex-shrink-0" />
              <span 
                className="flex-grow truncate cursor-pointer"
                onClick={() => onFileSelect(fullPath)}
              >
                {entry.name}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-800"
                  onClick={() => {
                    setIsRenamingFile(fullPath);
                    setNewName(entry.name);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-zinc-400 hover:text-red-600"
                  onClick={() => onFileDelete && onFileDelete(fullPath)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      );
    }
    
    // If it's a folder
    return (
      <div key={fullPath} className="mb-1">
        <div className="flex items-center py-1 px-2 rounded text-sm hover:bg-zinc-100">
          <FolderOpen className="h-4 w-4 mr-2 text-yellow-500" />
          <span className="truncate">{entry.name}</span>
        </div>
        <div className="pl-4">
          {Object.entries((entry as FolderEntry).children).map(([childKey, childEntry]) => 
            renderFileSystemEntry(childEntry, childKey, fullPath)
          )}
        </div>
      </div>
    );
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
      
      <div className="mt-2">
        {Object.entries(fileSystem).map(([key, entry]) => 
          renderFileSystemEntry(entry, key)
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 