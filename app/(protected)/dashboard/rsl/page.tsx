"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// RSL data structure from API
interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent?: string;
  createdAt: string;
  updatedAt: string;
}

function RSLCard({ rsl, onDelete, onCardClick }: { rsl: RSL; onDelete: (rsl: RSL) => void; onCardClick: (rsl: RSL) => void }) {
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
    onDelete(rsl);
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
    onCardClick(rsl);
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
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
              </DropdownMenuContent>
            </DropdownMenu>
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

export default function RSLPage() {
  const router = useRouter();
  const [rsls, setRsls] = useState<RSL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rslToDelete, setRslToDelete] = useState<RSL | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchRSLs() {
      try {
        const response = await fetch('/api/rsl');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setRsls(result.data || []);
          } else {
            setError('Failed to load RSL data');
          }
        } else {
          setError('Failed to connect to server');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchRSLs();
  }, []);

  const openDeleteModal = (rsl: RSL) => {
    setRslToDelete(rsl);
    setShowDeleteModal(true);
  };

  const handleDeleteRsl = async () => {
    if (!rslToDelete) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/rsl/${rslToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the deleted RSL from the state
        setRsls(prev => prev.filter(rsl => rsl.id !== rslToDelete.id));
        // Close delete modal
        setShowDeleteModal(false);
        setRslToDelete(null);
        
        toast.success("RSL deleted successfully!");
      } else {
        toast.error("Failed to delete RSL", {
          description: "Please try again.",
        });
      }
    } catch (error) {
      toast.error("Network error", {
        description: "Unable to delete RSL. Please check your connection.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = (rsl: RSL) => {
    router.push(`/dashboard/rsl/${rsl.id}`);
  };

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="RSL"
          text="Create and manage your RSL configurations."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="mb-2 h-6 rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader
          heading="RSL"
          text="Create and manage your RSL configurations."
        />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Icons.warning className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Error loading RSLs</h3>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <Icons.arrowRight className="mr-2 size-4" />
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        heading="RSL"
        text="Create and manage your RSL configurations."
      >
        {rsls.length > 0 && (
          <Link href="/dashboard/rsl/create">
            <Button>
              <Icons.add className="mr-2 size-4" />
              New RSL
            </Button>
          </Link>
        )}
      </DashboardHeader>

      {rsls.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {rsls.map((rsl) => (
            <RSLCard 
              key={rsl.id} 
              rsl={rsl} 
              onDelete={openDeleteModal}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4">
          <div className="mb-6 w-full max-w-[600px]">
            <Image
              src="/images/no-agents.webp"
              alt="No RSLs found"
              width={600}
              height={450}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="max-w-[500px] space-y-4 text-center">
            <h3 className="text-xl font-bold">No RSLs yet..</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Create your first RSL to start automating support, generating leads, and answering customer questions.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/rsl/create">
                <Button size="lg">
                  <Icons.add className="mr-2 size-4" />
                  New RSL
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        className="max-w-md"
      >
        <div className="flex flex-col items-center justify-center space-y-3 border-b p-4 pt-8 sm:px-16">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Icons.trash className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold">Delete RSL</h3>
          <p className="text-center text-sm text-muted-foreground">
            <b>Warning:</b> This will permanently delete the RSL for{" "}
            <span className="font-medium">{rslToDelete?.websiteUrl}</span>!
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const verification = formData.get("verification") as string;
            
            if (verification === "delete rsl") {
              await handleDeleteRsl();
            } else {
              toast.error("Verification text doesn't match");
            }
          }}
          className="flex flex-col space-y-6 bg-accent px-4 py-8 text-left sm:px-16"
        >
          <div>
            <label htmlFor="verification" className="block text-sm">
              To verify, type{" "}
              <span className="font-semibold text-black dark:text-white">
                delete rsl
              </span>{" "}
              below
            </label>
            <Input
              type="text"
              name="verification"
              id="verification"
              required
              autoFocus={false}
              autoComplete="off"
              className="mt-1 w-full border bg-background"
            />
          </div>

          <Button
            variant={isDeleting ? "disable" : "destructive"}
            disabled={isDeleting}
            type="submit"
          >
            {isDeleting ? (
              <>
                <Icons.spinner className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm delete RSL"
            )}
          </Button>
        </form>
      </Modal>
    </>
  );
}
