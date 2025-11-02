"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import LivePreview from "./live-preview";
import AiSuggester from "./ai-suggester";
import type { Language } from "./ai-suggester";

export default function CodeEnvironment() {
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");

  const [editorWidth, setEditorWidth] = useState(50);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setEditorWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    if (isResizing.current) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const handleSuggestion = (suggestion: string, language: Language) => {
    if (language === "html") {
      setHtmlCode((prev) => prev + suggestion);
    } else if (language === "css") {
      setCssCode((prev) => prev + suggestion);
    } else if (language === "javascript") {
      setJsCode((prev) => prev + suggestion);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-xl font-bold font-headline text-foreground">ClearSlate</h1>
        <AiSuggester
          onSuggest={handleSuggestion}
          currentCode={{ html: htmlCode, css: cssCode, javascript: jsCode }}
        />
      </header>
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div style={{ width: `${editorWidth}%` }} className="h-full overflow-y-auto">
          <Tabs defaultValue="html" className="h-full flex flex-col">
            <div className="p-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="html" className="flex-1 m-0 p-2 pt-0">
              <Textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                placeholder="<!-- HTML code goes here -->"
                className="w-full h-full font-code bg-muted/50 rounded-md resize-none"
              />
            </TabsContent>
            <TabsContent value="css" className="flex-1 m-0 p-2 pt-0">
              <Textarea
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
                placeholder="/* CSS styles go here */"
                className="w-full h-full font-code bg-muted/50 rounded-md resize-none"
              />
            </TabsContent>
            <TabsContent value="js" className="flex-1 m-0 p-2 pt-0">
              <Textarea
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                placeholder="// JavaScript logic goes here"
                className="w-full h-full font-code bg-muted/50 rounded-md resize-none"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div
          onMouseDown={handleMouseDown}
          className="w-2 cursor-col-resize flex items-center justify-center group"
        >
            <div className="w-0.5 h-full bg-border group-hover:bg-ring transition-colors duration-200"></div>
        </div>

        <div style={{ width: `${100 - editorWidth}%` }} className="h-full p-2">
            <Card className="h-full shadow-inner">
                <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)] p-0">
                    <LivePreview htmlCode={htmlCode} cssCode={cssCode} jsCode={jsCode} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
