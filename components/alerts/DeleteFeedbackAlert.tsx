"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const DeleteFeedbackAlert = ({
  showDeleteFeedbackAlert,
  setShowDeleteFeedbackAlert,
  handleConfirmRemove,
  loading,
  feedbackId,
}: {
  showDeleteFeedbackAlert: boolean;
  setShowDeleteFeedbackAlert: React.Dispatch<React.SetStateAction<boolean>>;
  handleConfirmRemove: (feedbackId: string) => Promise<void>;
  loading: boolean;
  feedbackId: string | undefined;
}) => {
  const [isMobileView, setIsMobileView] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 584);
    };

    handleResize();
    window.addEventListener("resize", handleResize); // Update on resize

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleRemove = async () => {
    if (feedbackId) {
      await handleConfirmRemove(feedbackId);
    } else {
      toast({
        variant: "destructive",
        title: "Unable to Remove Feedback",
        description: "Feedback was not removed...",
        toastStatus: "negative",
      });
    }
  };

  return isMobileView ? (
    <Sheet
      open={showDeleteFeedbackAlert}
      onOpenChange={setShowDeleteFeedbackAlert}
    >
      <SheetContent side="bottom" className=" bg-white rounded-t-xl ">
        <SheetHeader>
          <SheetTitle className="text-red-500 !text-start">
            Remove Feedback
          </SheetTitle>
          <SheetDescription className="!text-start">
            Are you sure you want to remove feedback_{feedbackId} ?
          </SheetDescription>
        </SheetHeader>
        <div className="w-full flex items-center justify-start gap-2 mt-7">
          <Button
            className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
            onClick={() => setShowDeleteFeedbackAlert(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={loading}
            className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
          >
            {loading ? "Removing..." : "Remove"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog
      open={showDeleteFeedbackAlert}
      onOpenChange={setShowDeleteFeedbackAlert}
    >
      <DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
        <DialogHeader>
          <DialogTitle className="text-red-500 !text-start">
            Remove Feedback
          </DialogTitle>
          <DialogDescription className=" text-sm !text-start">
            Are you sure you want to remove feedback_{feedbackId} ?
          </DialogDescription>
        </DialogHeader>

        <div className="w-full flex items-center justify-start gap-2">
          <Button
            className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
            onClick={() => setShowDeleteFeedbackAlert(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={loading}
            className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
          >
            {loading ? "Removing..." : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteFeedbackAlert;
