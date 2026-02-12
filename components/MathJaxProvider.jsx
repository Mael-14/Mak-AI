import Reac, { useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const MathJaxProvider = ({ html, fontSize = "18px" }) => {
    const [height, setHeight] = useState(100);

    const mathJaxConfig = `
    <script>
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
          processEscapes: true,
        },
        options: {
          enableMenu: false,
        }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  `;

    const fullHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${mathJaxConfig}
        <style>
          body {
            font-family: -apple-system, system-ui;
            font-size: ${fontSize};
            padding: 10px;
            color: #333;
            background-color: transparent;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

    return (
        <View style={{ height: 80, width: '100%', overflow: 'hidden' }}>
            <WebView
                originWhitelist={['*']}
                source={{ html: fullHtml }}

                style={{ backgroundColor: 'transparent' }}
                scrollEnabled={false}
            />
        </View>
    );
};

export default MathJaxProvider;