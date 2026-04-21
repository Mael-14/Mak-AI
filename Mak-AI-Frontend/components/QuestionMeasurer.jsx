import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { parseMarkdown } from '../utils/markdownParser';

/**
 * Utility to generate HTML for batch measuring many LaTeX/Markdown items at once.
 */
const generateMeasuringHTML = (quizData) => {
  let content = '';
  quizData.forEach((q, qIndex) => {
    // Question text
    content += `<div class="measure-item" id="q_${qIndex}">${parseMarkdown(q.question)}</div>`;
    // Options
    q.options.forEach((opt) => {
      content += `<div class="measure-item" id="o_${qIndex}_${opt.label}">${parseMarkdown(opt.value)}</div>`;
    });
    // Explanation
    content += `<div class="measure-item" id="e_${qIndex}">${parseMarkdown(q.explanation || 'No explanation available.')}</div>`;
  });

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
          renderMathInElement(document.body, {
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
          
          // Wait a bit for KaTeX to finish rendering
          setTimeout(function() {
            const results = {};
            document.querySelectorAll('.measure-item').forEach(el => {
              // Capture the scrollHeight which represents the full content height
              results[el.id] = el.scrollHeight;
            });
            window.ReactNativeWebView.postMessage(JSON.stringify(results));
          }, 800);
        }
      </script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system;
          font-size: 15px;
          line-height: 1.6;
          padding: 8px;
          width: 100%;
          background: white;
        }
        .measure-item {
          margin-bottom: 50px; /* Large margin to avoid overlap if needed */
          width: 100%;
          overflow: hidden;
          /* Important: display block to get accurate height */
          display: block;
        }
        p { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
};

/**
 * A hidden component that prenders and measures all quiz items in one pass.
 * Returns a map of heights via onMeasured callback.
 */
const QuestionMeasurer = ({ quizData, onMeasured }) => {
  const webViewRef = useRef(null);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📏 Batch measurement complete for', Object.keys(data).length, 'items');
      onMeasured(data);
    } catch (e) {
      console.error('❌ Error parsing batch measurement data', e);
    }
  };

  if (!quizData || quizData.length === 0) return null;

  return (
    <View style={styles.hidden}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMeasuringHTML(quizData) }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        style={{ width: 300, height: 1000 }} // Give it some space to work
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
    position: 'absolute',
    left: -2000,
    top: -2000,
  },
});

export default QuestionMeasurer;
