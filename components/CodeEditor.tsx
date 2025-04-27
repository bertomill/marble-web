'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange }) => {
  // Map language strings to monaco editor languages
  const getLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'markdown': 'markdown',
      'md': 'markdown',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'csharp',
      'cs': 'csharp',
      'go': 'go',
      'ruby': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'rust': 'rust',
      'shell': 'shell',
      'bash': 'shell',
      'sql': 'sql',
      'jsx': 'javascript',
      'tsx': 'typescript',
    };
    
    return languageMap[lang.toLowerCase()] || 'plaintext';
  };
  
  return (
    <Editor
      height="100%"
      language={getLanguage(language)}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: true },
        lineNumbers: 'on',
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        theme: 'vs-dark',
      }}
    />
  );
};

export default CodeEditor; 