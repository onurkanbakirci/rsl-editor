"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { type RSL } from "@/types/rsl";

interface RSLActionsFormProps {
  rsl: RSL;
  variant?: "buttons" | "copy-button";
}

export function RSLActionsForm({ rsl, variant = "buttons" }: RSLActionsFormProps) {
  const handleDownloadXml = () => {
    if (!rsl?.xmlContent) return;
    
    const blob = new Blob([rsl.xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsl-document.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("XML file downloaded");
  };

  const handleCopyToClipboard = () => {
    if (!rsl?.xmlContent) return;
    
    navigator.clipboard.writeText(rsl.xmlContent);
    toast.success("XML copied to clipboard");
  };

  const handleOpenInNewTab = () => {
    if (!rsl?.xmlContent) return;
    
    const blob = new Blob([rsl.xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (variant === "copy-button") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-3 top-3 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        onClick={handleCopyToClipboard}
      >
        <Icons.copy className="size-4" />
      </Button>
    );
  }

  return (
    <>
      {/* Action Buttons */}
      <Button
        onClick={handleDownloadXml}
        variant="outline"
      >
        <Icons.download className="mr-2 size-4" />
        Download
      </Button>

      <Button
        variant="outline"
        onClick={handleCopyToClipboard}
      >
        <Icons.copy className="mr-2 size-4" />
        Copy
      </Button>

      <Button
        variant="outline"
        onClick={handleOpenInNewTab}
      >
        <Icons.arrowUpRight className="mr-2 size-4" />
        Open
      </Button>
    </>
  );
}
