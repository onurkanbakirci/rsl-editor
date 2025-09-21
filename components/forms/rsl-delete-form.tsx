"use client";

import { useState, useTransition } from "react";
import { deleteRsl } from "@/actions/delete-rsl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Icons } from "@/components/shared/icons";
import { type RSL } from "@/types/rsl";

const deleteRslSchema = z.object({
  id: z.string().min(1, "RSL ID is required"),
  verification: z.string().min(1, "Verification is required"),
});

type FormData = z.infer<typeof deleteRslSchema>;

interface RSLDeleteFormProps {
  rsl: RSL;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export function RSLDeleteForm({ rsl, showModal, setShowModal }: RSLDeleteFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(deleteRslSchema),
    defaultValues: {
      id: rsl.id,
      verification: "delete rsl",
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (data.verification !== "delete rsl") {
      toast.error("Verification text doesn't match");
      return;
    }

    startTransition(async () => {
      const result = await deleteRsl(rsl.id, data);

      if (result.status !== "success") {
        toast.error("Failed to delete RSL", {
          description: result.message || "Please try again.",
        });
      } else {
        setShowModal(false);
        reset();
        toast.success("RSL deleted successfully!");
      }
    });
  });

  const handleModalClose = () => {
    setShowModal(false);
    reset();
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={handleModalClose}
      className="max-w-md"
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b p-4 pt-8 sm:px-16">
        <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <Icons.trash className="size-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold">Delete RSL</h3>
        <p className="text-center text-sm text-muted-foreground">
          <b>Warning:</b> This will permanently delete the RSL for{" "}
          <span className="font-medium">{rsl.websiteUrl}</span>!
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col space-y-6 bg-accent px-4 py-8 text-left sm:px-16">
        <input type="hidden" {...register("id")} />
        
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
            id="verification"
            required
            autoFocus={false}
            autoComplete="off"
            className="mt-1 w-full border bg-background"
            {...register("verification")}
          />
          {errors?.verification && (
            <p className="mt-1 text-sm text-red-600">
              {errors.verification.message}
            </p>
          )}
        </div>

        <Button
          variant={isPending ? "disable" : "destructive"}
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
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
  );
}
