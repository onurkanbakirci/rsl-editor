import Link from "next/link";
import Image from "next/image";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
  title: "RSL – SaaS Starter",
  description: "Create and manage your RSL configurations.",
});

// Mock RSL data structure
interface RSL {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  createdAt: string;
  updatedAt: string;
}

// Mock data - in real app this would come from an API
const mockRSLs: RSL[] = [
  // Uncomment to test with data:
  // {
  //   id: "1",
  //   name: "User Authentication RSL",
  //   description: "Handles user authentication and authorization logic",
  //   status: "active",
  //   createdAt: "2024-01-15",
  //   updatedAt: "2024-01-20"
  // },
  // {
  //   id: "2", 
  //   name: "Payment Processing RSL",
  //   description: "Manages payment workflows and transaction processing",
  //   status: "draft",
  //   createdAt: "2024-01-10",
  //   updatedAt: "2024-01-18"
  // }
];

function RSLCard({ rsl }: { rsl: RSL }) {
  const statusColors = {
    active: "bg-green-500/10 text-green-700 border-green-200",
    inactive: "bg-gray-500/10 text-gray-700 border-gray-200", 
    draft: "bg-yellow-500/10 text-yellow-700 border-yellow-200"
  };

  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{rsl.name}</h3>
            <Badge 
              variant="outline" 
              className={statusColors[rsl.status]}
            >
              {rsl.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {rsl.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created: {rsl.createdAt}</span>
            <span>Updated: {rsl.updatedAt}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Icons.settings className="size-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Icons.ellipsis className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RSLPage() {
  const rsls = mockRSLs;

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
              Create New RSL
            </Button>
          </Link>
        )}
      </DashboardHeader>
      
      {rsls.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {rsls.map((rsl) => (
            <RSLCard key={rsl.id} rsl={rsl} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-[700px]">
            <div className="mb-8 w-full">
              <Image
                src="/images/no-agents.webp"
                alt="No RSLs found"
                width={1200}
                height={1200}
                className="mx-auto w-full max-w-[600px] h-auto"
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">No RSLs yet..</h3>
            <p className="text-muted-foreground mb-6 text-center">
              Create your first RSL to start automating support, generating leads, and answering customer questions.
            </p>
            <Link href="/dashboard/rsl/create">
              <Button>
                <Icons.add className="mr-2 size-4" />
                New RSL
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
