import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { backendBaseUrl } from "@/lib/utils";
import axios from "axios";
import { toast } from "../ui/use-toast";
import Image from "next/image";

const formSchema = z.object({
    pixelId: z
        .string()
        .regex(/^(\d{15,16})$/, "Pixel ID must be a 15 or 16 digit number.")
        .min(15, "Pixel ID must be at least 15 digits.")
        .max(16, "Pixel ID cannot exceed 16 digits."),
    accessToken: z
        .string()
        .regex(
            /^[A-Za-z0-9_.\-]{30,200}$/,
            "Access Token must be alphanumeric and between 30-200 characters."
        )
        .min(30, "Access Token must be at least 30 characters.")
        .max(200, "Access Token cannot exceed 200 characters."),
});

const EditPixelDetails = ({
    isOpen,
    onClose,
    pixelId,
    setPixelId,
    accessToken,
    setAccessToken,
    creatorId,
    handleOpenModal,
    updatingData,
    setUpdatingData,
    methods,
    initialState,
}: {
    isOpen: boolean;
    onClose: () => void;
    pixelId: string;
    setPixelId: any;
    accessToken: string;
    setAccessToken: any;
    creatorId: string;
    handleOpenModal: any;
    updatingData: boolean;
    setUpdatingData: any;
    methods: any;
    initialState: any;
}) => {
    if (!isOpen) return null;

    const { formState } = methods;
	const { isValid } = formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            console.log(values)
            setUpdatingData(true);
            await axios.post(`${backendBaseUrl}/creator/analytics/update`, {
                userId: creatorId,
                pixelId: values.pixelId,
                accessToken: values.accessToken,
            });

            setPixelId(values.pixelId);
            setAccessToken(values.accessToken);

            handleOpenModal();

            toast({
                variant: "destructive",
                title: "Analytics Updated",
                description:
                    "Your analytics information has been successfully updated.",
                toastStatus: "positive",
            });

            methods.reset(values);
        } catch (error: any) {
            console.warn(error);
            toast({
                variant: "destructive",
                title: "Error Updating Analytics",
                description:
                    "An error occurred while updating your analytics. Please try again later.",
                toastStatus: "negative",
            });
        } finally {
            onClose();
            setUpdatingData(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Analytics Integration</h2>
                    <button
                        aria-label="Close"
                        className="text-gray-500 text-xl hover:text-gray-700"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <FormProvider {...methods}>
                    <form
                        onSubmit={methods.handleSubmit(onSubmit)}
                        className="grid grid-cols-1 gap-5 items-center"
                    >
                        <FormField
                            control={methods.control}
                            name="pixelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            className="h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-400 rounded-xl px-4 py-3"
                                            placeholder="Pixel ID"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="pl-1" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={methods.control}
                            name="accessToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            className="h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-400 rounded-xl px-4 py-3"
                                            placeholder="Pixel Conversions API Access Token"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="pl-1" />
                                </FormItem>
                            )}
                        />
                        <div className="mt-6 flex justify-end gap-4">
                            <Button
                                className={`text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect ${updatingData ? "hidden" : ""}`}
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-black hoverScaleDownEffect rounded-full text-white"
                                type="submit"
                                disabled={updatingData || !isValid}
                            >
                                {updatingData ? (
                                    <Image
                                        src="/icons/loading-circle.svg"
                                        alt="Loading..."
                                        width={24}
                                        height={24}
                                        priority
                                    />
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
};

export default EditPixelDetails;
