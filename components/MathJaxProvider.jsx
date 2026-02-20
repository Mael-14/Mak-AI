import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Parse markdown tables to HTML
 * Supports standard markdown table syntax:
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 */
const parseMarkdownTable = (text) => {
  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let tableLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line is a table row (starts and ends with |)
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      // Process accumulated table
      if (inTable && tableLines.length >= 2) {
        html += convertTableLinesToHTML(tableLines);
        tableLines = [];
      }
      inTable = false;
      
      // Add non-table line
      if (line) {
        html += line + '\n';
      }
    }
  }
  
  // Process any remaining table
  if (inTable && tableLines.length >= 2) {
    html += convertTableLinesToHTML(tableLines);
  }
  
  return html;
};

/**
 * Convert markdown table lines to HTML table
 */
const convertTableLinesToHTML = (lines) => {
  if (lines.length < 2) return '';
  
  let html = '<table class="markdown-table">\n';
  let isFirstRow = true;
  let hasHeader = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip separator line (|---|---|)
    if (line.match(/^\|[\s:-]+\|$/)) {
      hasHeader = true;
      continue;
    }
    
    // Split cells (remove leading/trailing |)
    const cells = line
      .substring(1, line.length - 1)
      .split('|')
      .map(cell => cell.trim());
    
    // First row before separator is header
    if (isFirstRow && hasHeader) {
      html += '  <thead>\n    <tr>\n';
      cells.forEach(cell => {
        html += `      <th>${cell}</th>\n`;
      });
      html += '    </tr>\n  </thead>\n  <tbody>\n';
      isFirstRow = false;
    } else {
      if (isFirstRow) {
        html += '  <tbody>\n';
        isFirstRow = false;
      }
      html += '    <tr>\n';
      cells.forEach(cell => {
        html += `      <td>${cell}</td>\n`;
      });
      html += '    </tr>\n';
    }
  }
  
  html += '  </tbody>\n</table>\n';
  return html;
};

/**
 * Parse markdown text and convert to HTML
 * Enhanced with table support
 */
const parseMarkdown = (text) => {
  if (!text) return '';

  // First, process tables separately
  text = parseMarkdownTable(text);

  // Escape HTML (but preserve table tags)
  const tablePlaceholders = [];
  text = text.replace(/<table[\s\S]*?<\/table>/g, (match) => {
    const placeholder = `__TABLE_PLACEHOLDER_${tablePlaceholders.length}__`;
    tablePlaceholders.push(match);
    return placeholder;
  });

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks: ```code```
  const codeBlocks = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `__CODE_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return placeholder;
  });

  // Headers: # ## ### etc
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Blockquotes: > text
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule: --- or ***
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Unordered lists: - or * at start of line
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>(\n|$))+/g, '<ul>$&</ul>');

  // Ordered lists: 1. 2. 3. etc
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>(\n|$))+/g, '<ol>$&</ol>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = '<p>' + html + '</p>';

  // Clean up
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[123])/g, '$1');
  html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>|<ol>)/g, '$1');
  html = html.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');

  // Restore code blocks
  codeBlocks.forEach((code, i) => {
    html = html.replace(`__CODE_${i}__`, code);
  });

  // Restore tables
  tablePlaceholders.forEach((table, i) => {
    html = html.replace(`__TABLE_PLACEHOLDER_${i}__`, table);
  });

  return html;
};

/**
 * Generate HTML with Markdown + MathJax for LaTeX rendering
 * Enhanced with table support
 */
const generateMathJaxHTML = (text, isError = false) => {
  const textColor = isError ? '#CC0000' : '#000';
  const backgroundColor = isError ? '#FFF3F3' : '#ffffff';
  const borderColor = isError ? '#FF4444' : '#E0E0E0';

  // Parse markdown first
  const htmlContent = parseMarkdown(text);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script type="text/javascript" async
        src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML">
      </script>
      <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [['$','$'], ['\\\\(','\\\\)']],
            displayMath: [['$$','$$'], ['\\\\[','\\\\]']],
            processEscapes: true,
            processEnvironments: true
          },
          CommonHTML: { 
            scale: 100,
            linebreaks: { automatic: true }
          },
          "HTML-CSS": { 
            scale: 100,
            linebreaks: { automatic: true },
            availableFonts: ["TeX"]
          },
          SVG: { 
            scale: 100,
            linebreaks: { automatic: true }
          },
          showMathMenu: false,
          showProcessingMessages: false,
          messageStyle: "none",
          // Enable LaTeX table support
          TeX: {
            extensions: ["AMSmath.js", "AMSsymbols.js", "array.js", "color.js"],
            equationNumbers: { autoNumber: "AMS" }
          }
        });

        MathJax.Hub.Queue(function() {
          // Notify React Native that rendering is complete
          setTimeout(function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              height: document.documentElement.scrollHeight
            }));
          }, 100);
        });
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
        
        /* Math */
        .MathJax {
          font-size: 1em !important;
        }
        
        .MathJax_Display {
          margin: 12px 0 !important;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        /* LaTeX Tables (rendered by MathJax) */
        .MathJax table {
          margin: 12px auto;
        }
        
        /* Ensure content doesn't overflow */
        .MathJax_SVG {
          max-width: 100% !important;
        }
        
        mjx-container {
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        mjx-container[display="true"] {
          margin: 12px 0 !important;
        }
      </style>
    </head>
    <body>
      <div id="content">
        ${htmlContent}
      </div>
      <script>
        // Additional height calculation after page load
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

const MathJaxProvider = ({ html, fontSize = "18px" }) => {
    const [height, setHeight] = useState(30);
    const webViewRef = useRef(null);
    const [contentKey, setContentKey] = useState(0);

    // Reset height and force re-render when content changes
    useEffect(() => {
        console.log('Content changed, resetting height');
        setHeight(30);
        setContentKey(prev => prev + 1);
    }, [html]);

    const fullHtml = generateMathJaxHTML(html);

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
                    // backgroundColor: 'transparent',
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