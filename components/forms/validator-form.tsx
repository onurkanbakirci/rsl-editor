"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  results: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    context?: string;
  }>;
}

export function ValidatorForm() {
  const [rslContent, setRslContent] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("paste");

  const validateRslDocument = useCallback(async () => {
    if (!rslContent.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/rsl/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xmlContent: rslContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate RSL document");
      }

      const result = await response.json();
      setValidationResult(result);
      
      if (result.isValid) {
        toast.success("RSL document is valid!");
      } else {
        toast.error(`RSL document has ${result.errors.length} error(s)`);
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate RSL document");
    } finally {
      setIsValidating(false);
    }
  }, [rslContent]);

  // Auto-validate when content changes
  useEffect(() => {
    if (rslContent.trim()) {
      const timeoutId = setTimeout(() => {
        validateRslDocument();
      }, 500); // Debounce validation by 500ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setValidationResult(null);
    }
  }, [rslContent, validateRslDocument]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml') && !file.name.endsWith('.rsl')) {
      toast.error("Please upload an XML or RSL file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRslContent(content);
      setActiveTab("paste"); // Switch to paste tab to show the content
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadResults = () => {
    if (!validationResult) return;

    const results = {
      timestamp: new Date().toISOString(),
      isValid: validationResult.isValid,
      summary: {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
      },
      details: validationResult.results,
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsl-validation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            RSL Document Input
          </CardTitle>
          <CardDescription>
            Upload an RSL file or paste your RSL XML content below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="paste">Paste Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">XML or RSL files</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xml,.rsl"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </TabsContent>
            
            <TabsContent value="paste" className="space-y-4">
              <Textarea
                placeholder="Paste your RSL XML content here..."
                value={rslContent}
                onChange={(e) => setRslContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationResult?.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : validationResult?.isValid === false ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            )}
            Validation Results
          </CardTitle>
          <CardDescription>
            {validationResult
              ? `${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`
              : "Results will appear here after validation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!validationResult ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No validation results yet
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-2">
                <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                  {validationResult.isValid ? "Valid" : "Invalid"}
                </Badge>
                {validationResult.errors.length > 0 && (
                  <Badge variant="destructive">
                    {validationResult.errors.length} Error(s)
                  </Badge>
                )}
                {validationResult.warnings.length > 0 && (
                  <Badge variant="secondary">
                    {validationResult.warnings.length} Warning(s)
                  </Badge>
                )}
              </div>

              {/* Detailed Results */}
              <ScrollArea className="h-[300px] w-full rounded border p-4">
                <div className="space-y-3">
                  {validationResult.results.map((result, index) => (
                    <div key={index}>
                      <Alert className={
                        result.type === 'error' 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
                          : result.type === 'warning'
                          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                      }>
                        <AlertDescription className="text-sm">
                          <div className="flex items-start gap-2">
                            {result.type === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            ) : result.type === 'warning' ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium capitalize">{result.type}</p>
                              <p className="text-muted-foreground">{result.message}</p>
                              {result.context && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Context: {result.context}
                                </p>
                              )}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                      {index < validationResult.results.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                  
                  {validationResult.results.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No issues found! Your RSL document is valid.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(validationResult, null, 2))}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Results
                </Button>
                <Button variant="outline" size="sm" onClick={downloadResults}>
                  <Download className="h-4 w-4 mr-1" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
