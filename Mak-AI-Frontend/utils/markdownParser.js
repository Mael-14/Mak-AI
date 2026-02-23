/**
 * Parse markdown tables to HTML
 * Supports standard markdown table syntax:
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 */
export const parseMarkdownTable = (text) => {
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
export const convertTableLinesToHTML = (lines) => {
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
export const parseMarkdown = (text) => {
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
