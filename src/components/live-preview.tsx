"use client";

import { useState, useEffect } from "react";

interface LivePreviewProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

export default function LivePreview({
  htmlCode,
  cssCode,
  jsCode,
}: LivePreviewProps) {
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSrcDoc(`
        <html>
          <head>
            <style>${cssCode}</style>
          </head>
          <body>
            ${htmlCode}
            <script>${jsCode}</script>
          </body>
        </html>
      `);
    }, 500); // Debounce to avoid rapid updates

    return () => clearTimeout(timeout);
  }, [htmlCode, cssCode, jsCode]);

  return (
    <iframe
      srcDoc={srcDoc}
      title="Live Preview"
      sandbox="allow-scripts allow-forms"
      width="100%"
      height="100%"
      className="bg-white rounded-b-lg border-t"
    />
  );
}
