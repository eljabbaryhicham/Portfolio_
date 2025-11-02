"use server";
import { run } from "@genkit-ai/next/server";
import { suggestCodeFlow } from "@/ai/flows/suggest-code";

interface SuggestCodeParams {
  prompt: string;
  language: "html" | "css" | "javascript";
  html: string;
  css: string;
  javascript: string;
}

export async function suggestCodeAction(params: SuggestCodeParams) {
  try {
    const suggestion = await run(suggestCodeFlow, params);
    return { suggestion };
  } catch (error: any) {
    console.error("Error in suggestCodeAction:", error);
    return { error: error.message || "An error occurred while generating the suggestion." };
  }
}
