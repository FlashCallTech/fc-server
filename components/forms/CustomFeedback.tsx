import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import GetRandomImage from "@/utils/GetRandomImage";
import { useToast } from "../ui/use-toast";

const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false);
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const CustomFeedback = ({
  isOpen,
  onOpenChange,
  creatorId,
  refetch,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  creatorId: string;
  refetch?: any;
}) => {
  const isSmallScreen = useScreenSize();
  const [rating, setRating] = useState<number>(5);
  const [name, setName] = useState("Flashcall User");
  const [testimonial, setTestimonial] = useState("");
  const [addingTestimonial, setAddingTestimonial] = useState(false);
  const { toast } = useToast();
  let image = useRef<string | null>(null);

  useEffect(() => {
    image.current = GetRandomImage(true);
  }, []);

  const handleRating = (index: number) => {
    setRating(index);
  };

  const handleFeedbackSubmit = async () => {
    if (!image.current) {
      toast({
        variant: "destructive",
        title: "Unable to submit testimonial",
        description: "Image not loaded properly.",
        toastStatus: "negative",
      });
      return;
    }

    try {
      setAddingTestimonial(true);

      const requestData = {
        creatorId: creatorId,
        callId: crypto.randomUUID(),
        clientId: "6756c9f7792c48a3f5d8b2c3",
        showFeedback: false,
        rating: rating,
        feedbackText: testimonial,
        isCustomAdded: true,
        customUserName: name || "Flashcall User",
        customUserImage: image.current,
      };

      await axios.post(`${backendBaseUrl}/feedback/call/create`, requestData);

      setTimeout(() => {
        onOpenChange(false);
        refetch();
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to add Testimonial",
        description: "Something went wrong.",
        toastStatus: "negative",
      });
      console.error("Error submitting testimonial:", error);
    } finally {
      setTimeout(() => {
        setAddingTestimonial(false);
      }, 1000);
    }
  };

  const content = (
    <div className={`size-full md:max-w-lg`}>
      <div className="size-full flex flex-col items-start justify-start gap-5">
        <div className="size-full flex flex-col items-start justify-start gap-5 py-5 mb-20">
          {/* Name Input */}
          <div className="w-full">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add Username"
              className="mt-1"
            />
          </div>

          {/* Rating Input */}
          <div className="w-full">
            <label className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((index) => (
                <Star
                  key={index}
                  size={20}
                  className={`cursor-pointer hoverScaleDownEffect ${
                    index <= rating
                      ? "text-yellow-400 fill-[#FACC15]"
                      : "text-gray-300 hover:fill-gray-300"
                  }`}
                  onClick={() => handleRating(index)}
                />
              ))}
            </div>
          </div>

          {/* Testimonial Input */}
          <div className="w-full">
            <label className="text-sm font-medium">Your Testimonial</label>
            <Textarea
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              placeholder="Type your feedback here ..."
              className="mt-1 max-h-[200px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2.5">
              Maximum 500 characters
            </p>
          </div>

          {/* Live Preview Section */}
          <div className="w-full flex flex-col items-start justify-start gap-4 mt-7">
            <h3 className="text-lg font-semibold">Preview Your Testimonial</h3>
            <div className="w-full p-4 border rounded-lg bg-[#F9FAFB]">
              <div className="w-full flex items-start gap-4">
                {/* Profile Image */}
                <Image
                  width={1000}
                  height={1000}
                  src={image.current as string}
                  alt="Profile"
                  className="size-12 object-cover rounded-full"
                />
                <div className="flex flex-col">
                  {/* Name Preview */}
                  <p className="font-medium">{name || "Your Name"}</p>

                  {/* Rating Preview */}
                  <div className="flex space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <Star
                        key={index}
                        size={18}
                        className={`${
                          index <= rating
                            ? "text-yellow-400 fill-[#FACC15]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Testimonial Preview */}
                  <p className="text-sm text-gray-600 line-clamp-3 text-ellipsis mt-2.5">
                    {testimonial ||
                      "Your testimonial will appear here as you type..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          className={`bg-white w-full flex gap-4 items-center justify-end py-2.5 sticky bottom-0`}
        >
          <Button
            className="rounded-full"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Clear Form
          </Button>
          <Button
            disabled={rating < 1}
            className="bg-black text-white rounded-full hoverScaleDownEffect"
            onClick={handleFeedbackSubmit}
          >
            {addingTestimonial ? "Adding ..." : "Add Testimonial"}
          </Button>
        </div>
      </div>
    </div>
  );

  return isSmallScreen ? (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full bg-white overflow-y-scroll no-scrollbar !pb-0"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-start">
            Add Testimonial
          </SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-white rounded-lg shadow-lg !pb-0">
        {/* Fixed Header */}
        <DialogHeader className="sticky top-0 z-10">
          <DialogTitle className="text-2xl font-semibold text-start">
            Add Testimonial
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="max-h-[600px] overflow-y-auto no-scrollbar">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomFeedback;
