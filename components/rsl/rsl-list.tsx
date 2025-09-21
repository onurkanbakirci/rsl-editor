"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RSLCard } from "@/components/rsl/rsl-card";
import { RSLDeleteForm } from "@/components/forms/rsl-delete-form";
import { type RSL } from "@/types/rsl";

interface RSLListProps {
  rsls: RSL[];
}

export function RSLList({ rsls }: RSLListProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rslToDelete, setRslToDelete] = useState<RSL | null>(null);

  const openDeleteModal = (rsl: RSL) => {
    setRslToDelete(rsl);
    setShowDeleteModal(true);
  };

  const handleCardClick = (rsl: RSL) => {
    router.push(`/dashboard/rsl/${rsl.id}`);
  };

  return (
    <>
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

      {/* Delete Confirmation Modal */}
      {rslToDelete && (
        <RSLDeleteForm
          rsl={rslToDelete}
          showModal={showDeleteModal}
          setShowModal={setShowDeleteModal}
        />
      )}
    </>
  );
}
