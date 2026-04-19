import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { parseMarkdown } from '../utils/markdownParser';

/**
 * Generate HTML with Markdown + MathJax for LaTeX rendering
 * Enhanced with table support
 */
const generateMathJaxHTML = (text, isError = false) => {
  const textColor = isError ? '#CC0000' : '#000';
  const backgroundColor = isError ? '#FFF3F3' : 'transparent';
  const borderColor = isError ? '#FF4444' : '#E0E0E0';

  // Parse markdown first
  const htmlContent = parseMarkdown(text);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js"></script>
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="initKatex()"></script>
      <script>
        function initKatex() {
          renderMathInElement(document.getElementById('content'), {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '\\\\[', right: '\\\\]', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\\\(', right: '\\\\)', display: false}
            ],
            throwOnError: false,
            trust: true,
            strict: false
          });
          
          setTimeout(function() {
            const height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight
            );
            window.ReactNativeWebView.postMessage(JSON.stringify({
              height: height
            }));
          }, 100);
        }
      </script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          height: auto;
          overflow: hidden;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: ${textColor};
          background-color: ${backgroundColor};
          padding: 8px;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        /* Paragraphs */
        p {
          margin-bottom: 10px;
          line-height: 1.6;
        }
        
        /* Headers */
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 16px 0 10px 0;
          color: ${textColor};
        }
        h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 14px 0 8px 0;
          color: ${textColor};
        }
        h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 12px 0 6px 0;
          color: ${textColor};
        }
        
        /* Lists */
        ul, ol {
          margin: 10px 0 10px 20px;
          padding-left: 20px;
        }
        li {
          margin-bottom: 6px;
          line-height: 1.6;
        }
        
        /* Code */
        code {
          background-color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #333;
        }
        
        pre {
          background-color: #f5f5f5;
          border: 1px solid ${borderColor};
          border-radius: 6px;
          padding: 12px;
          margin: 10px 0;
          overflow-x: auto;
          line-height: 1.4;
        }
        
        pre code {
          background-color: transparent;
          padding: 0;
          font-size: 13px;
          color: #333;
        }
        
        /* Blockquotes */
        blockquote {
          border-left: 4px solid #007AFF;
          padding-left: 12px;
          margin: 10px 0;
          color: #666;
          font-style: italic;
          background-color: #f9f9f9;
          padding: 8px 0 8px 12px;
          border-radius: 4px;
        }
        
        /* Horizontal Rule */
        hr {
          border: none;
          border-top: 2px solid #E0E0E0;
          margin: 16px 0;
        }
        
        /* Links */
        a {
          color: #007AFF;
          text-decoration: none;
        }
        a:active {
          opacity: 0.7;
        }
        
        /* Text formatting */
        strong {
          font-weight: 600;
          color: ${textColor};
        }
        em {
          font-style: italic;
        }
        
        /* Markdown Tables */
        table.markdown-table {
          width: 100%;
          max-width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          background-color: #fff;
          border: 1px solid #E0E0E0;
          border-radius: 8px;
          overflow: hidden;
          font-size: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        table.markdown-table thead {
          background-color: #F5F7FA;
        }
        
        table.markdown-table th {
          padding: 12px 14px;
          text-align: left;
          font-weight: 600;
          color: #1F2937;
          border-bottom: 2px solid #D1D5DB;
          border-right: 1px solid #E5E7EB;
          font-size: 14px;
        }
        
        table.markdown-table th:last-child {
          border-right: none;
        }
        
        table.markdown-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #E5E7EB;
          border-right: 1px solid #F3F4F6;
          color: #374151;
          vertical-align: top;
        }
        
        table.markdown-table td:last-child {
          border-right: none;
        }
        
        table.markdown-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        table.markdown-table tbody tr:hover {
          background-color: #F9FAFB;
        }
        
        /* Make tables scrollable on small screens */
        @media (max-width: 600px) {
          table.markdown-table {
            font-size: 12px;
          }
          
          table.markdown-table th,
          table.markdown-table td {
            padding: 8px 10px;
          }
        }
        
        /* KaTeX styles */
        .katex {
          font-size: 1.1em !important;
        }
        
        .katex-display {
          margin: 12px 0 !important;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 8px 0;
        }
        
        .katex-html {
          max-width: 100%;
        }
      </style>
    </head>
    <body>
      <div id="content">
        ${htmlContent}
      </div>
      <script>
        // Fallback or secondary height calculation after full load
        window.addEventListener('load', function() {
          setTimeout(function() {
            const height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight
            );
            window.ReactNativeWebView.postMessage(JSON.stringify({
              height: height
            }));
          }, 200);
        });
      </script>
    </body>
    </html>
  `;
};

/**
 * Wrap raw HTML in the MathJax/KaTeX template without additional markdown parsing
 */
const wrapInHtmlTemplate = (htmlContent) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js"></script>
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="initKatex()"></script>
      <script>
        function initKatex() {
          renderMathInElement(document.getElementById('content'), {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '\\\\[', right: '\\\\]', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\\\(', right: '\\\\)', display: false}
            ],
            throwOnError: false,
            trust: true,
            strict: false
          });
          
          setTimeout(function() {
            const height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight
            );
            window.ReactNativeWebView.postMessage(JSON.stringify({
              height: height
            }));
          }, 100);
        }
      </script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: #000;
          background-color: transparent;
          padding: 8px;
        }
        .katex { font-size: 1.1em !important; }
      </style>
    </head>
    <body>
      <div id="content">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;
};

const MathJaxProvider = ({ html, fontSize = "18px", useRawHtml = false }) => {
  const [height, setHeight] = useState(30);
  const webViewRef = useRef(null);
  const [contentKey, setContentKey] = useState(0);

  // Reset height and force re-render when content changes
  useEffect(() => {
    console.log('Content changed, resetting height');
    setHeight(30);
    setContentKey(prev => prev + 1);
  }, [html]);

  const fullHtml = useRawHtml ? wrapInHtmlTemplate(html) : generateMathJaxHTML(html);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📏 Height calculation received:', data);

      if (data.height && data.height > 0) {
        // Add small padding for safety
        const finalHeight = Math.max(30, data.height);

        console.log('✅ Setting final height to:', finalHeight);
        setHeight(finalHeight);
      } else {
        console.log('❌ Invalid height data received:', data);
      }
    } catch (error) {
      console.error('❌ Error handling WebView message:', error);
    }
  };

  return (
    <View style={{
      height: height,
      width: '100%',
      overflow: 'hidden',
    }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: fullHtml }}
        key={contentKey}
        style={{
          backgroundColor: 'transparent',
          height: height,
        }}
        scrollEnabled={false}
        onMessage={handleMessage}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onLoadEnd={() => {
          console.log('WebView loaded successfully');
        }}
      />
    </View>
  );
};

export default MathJaxProvider;