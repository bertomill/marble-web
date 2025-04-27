'use client';

import React, { useRef, useEffect } from 'react';

interface FileContent {
  content: string;
  language: string;
}

interface PreviewComponentProps {
  html?: string;
  css?: string;
  javascript?: string;
  files?: Record<string, FileContent>;
}

const PreviewComponent: React.FC<PreviewComponentProps> = ({ 
  html, 
  css, 
  javascript,
  files
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to detect language from filename
  const getLanguageFromFileName = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'html' || extension === 'htm') return 'html';
    if (extension === 'css') return 'css';
    if (['js', 'jsx'].includes(extension)) return 'javascript';
    if (['ts', 'tsx'].includes(extension)) return 'typescript';
    
    return 'text';
  };

  useEffect(() => {
    if (!iframeRef.current) return;

    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';

    // Process provided individual content if any
    if (html) htmlContent = html;
    if (css) cssContent = css;
    if (javascript) jsContent = javascript;

    // Process files if provided
    if (files) {
      Object.entries(files).forEach(([filename, file]) => {
        const language = file.language || getLanguageFromFileName(filename);
        
        if (language === 'html') {
          htmlContent += file.content;
        } else if (language === 'css') {
          cssContent += file.content;
        } else if (language === 'javascript') {
          jsContent += file.content;
        }
      });
    }

    // If HTML content is just a fragment (not a complete document),
    // wrap it in a basic HTML document structure
    if (htmlContent && !htmlContent.includes('<!DOCTYPE') && !htmlContent.includes('<html')) {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          ${cssContent ? '<style>' + cssContent + '</style>' : ''}
        </head>
        <body>
          ${htmlContent}
          ${jsContent ? '<script>' + jsContent + '</script>' : ''}
        </body>
        </html>
      `;
    } else if (!htmlContent) {
      // Create default HTML structure if no HTML provided
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          ${cssContent ? '<style>' + cssContent + '</style>' : ''}
        </head>
        <body>
          <div id="app">
            <h2>Preview</h2>
            <p>This is a preview of your application.</p>
          </div>
          ${jsContent ? '<script>' + jsContent + '</script>' : ''}
        </body>
        </html>
      `;
    } else if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
      // If it's a complete HTML document, inject CSS and JS if they're not already there
      if (cssContent && !htmlContent.includes('<style>')) {
        htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
      }
      if (jsContent && !htmlContent.includes('<script>')) {
        htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
      }
    }

    // Set the srcDoc of the iframe directly instead of writing to the document
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [html, css, javascript, files]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
      title="Preview"
    />
  );
};

export default PreviewComponent; 