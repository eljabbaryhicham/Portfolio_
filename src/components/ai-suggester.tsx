"use client";

import { useState } from "react";
import { Wand2, Loader2, Copy, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { suggestCodeAction } from "@/app/actions";
import { Card, CardContent } from "./ui/card";

const languages = ["html", "css", "javascript"] as const;
export type Language = (typeof languages)[number];

const formSchema = z.object({
  prompt: z.string().min(10, "Please describe what you need in at least 10 characters."),
  language: z.enum(languages),
});

interface AiSuggesterProps {
  onSuggest: (suggestion: string, language: Language) => void;
  currentCode: {
    html: string;
    css: string;
    javascript: string;
  };
}

export default function AiSuggester({ onSuggest, currentCode }: AiSuggesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      language: "html",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestion("");
    try {
      const result = await suggestCodeAction({
        ...values,
        ...currentCode,
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "AI Suggestion Failed",
          description: result.error,
        });
      } else {
        setSuggestion(result.suggestion || "");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An unexpected error occurred.",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleApply = () => {
    onSuggest(suggestion, form.getValues("language"));
    setIsOpen(false);
    toast({
        title: "Suggestion Applied",
        description: `The ${form.getValues("language")} code has been updated.`
    })
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset();
        setSuggestion('');
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          AI Suggest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>AI Code Suggester</DialogTitle>
          <DialogDescription>
            Describe what you want to build or change, and let AI assist you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Request</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 'Create a blue button with a hover effect'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Suggestion
                </Button>
            </DialogFooter>
          </form>
        </Form>
        {(isLoading || suggestion) && (
            <div className="mt-4">
                <h3 className="mb-2 font-semibold">Suggested Code:</h3>
                <Card className="relative">
                    <CardContent className="p-0">
                        {isLoading ? (
                             <div className="flex items-center justify-center h-32 text-muted-foreground">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Generating...
                             </div>
                        ) : (
                            <>
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy</span>
                            </Button>
                            <pre className="p-4 bg-muted rounded-lg text-sm font-code overflow-x-auto max-h-48">
                                <code>
                                {suggestion}
                                </code>
                            </pre>
                            </>
                        )}
                    </CardContent>
                </Card>
                {suggestion && !isLoading && (
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleApply}>Apply Suggestion</Button>
                    </div>
                )}
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
