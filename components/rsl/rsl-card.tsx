"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/shared/icons";
import { type RSL, type RSLCardProps } from "@/types/rsl";

// Re-export RSL type for convenience
export type { RSL } from "@/types/rsl";

export function RSLCard({ rsl, onDelete, onCardClick, className }: RSLCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWebsiteName = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  };

  const openXmlInNewTab = () => {
    if (rsl.xmlContent) {
      const blob = new Blob([rsl.xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const handleDelete = () => {
    onDelete?.(rsl);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons or dropdown content
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[role="menu"]') ||
      target.closest('[data-radix-popper-content-wrapper]')
    ) {
      return;
    }
    onCardClick?.(rsl);
  };

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${className || ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icons.file className="size-5 text-muted-foreground" />
              {getWebsiteName(rsl.websiteUrl)}
            </CardTitle>
            <CardDescription className="mt-1">
              {rsl.websiteUrl}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="size-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                openXmlInNewTab();
              }}
              disabled={!rsl.xmlContent}
              title="View XML in new tab"
            >
              <Icons.arrowUpRight className="size-4" />
            </Button>
            {(onDelete || onCardClick) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="size-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icons.ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/rsl/${rsl.id}/edit`);
                    }}
                  >
                    <Icons.edit className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Icons.trash className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Icons.clock className="size-4" />
          <span>Updated {formatDate(rsl.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
