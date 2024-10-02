import React, { useEffect, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "../ui/textarea";
import { useForm, useWatch } from "react-hook-form";
import { reportSchema } from "@/lib/validator";
import { Button } from "../ui/button";
import Image from "next/image";

const ReportDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isChanged, setIsChanged] = useState(false);

	// Define the form using the zod schema and react-hook-form
	const form = useForm<z.infer<typeof reportSchema>>({
		mode: "onChange",
		resolver: zodResolver(reportSchema),
		defaultValues: {
			issue: "",
		},
	});

	const { formState } = form;
	const { errors, isValid } = formState;

	// Submit handler
	const onSubmit = async (values: z.infer<typeof reportSchema>) => {
		try {
			setLoading(true);
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));
			console.log("Form submitted with values:", values);

			// Reset the form after submission
			form.reset();
		} catch (error) {
			console.error("Failed to submit:", error);
		} finally {
			setLoading(false);
		}
	};

	// Watch form values to detect changes
	const watchedIssue = useWatch({
		control: form.control,
		name: "issue",
	});

	useEffect(() => {
		// Check if the issue input has any content
		setIsChanged(watchedIssue.trim() !== "");
	}, [watchedIssue]);

	useEffect(() => {
		const handleResize = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		handleResize();

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	// Handles open/close state of the modal
	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
	};

	return (
		<section>
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetTrigger asChild>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-4 text-gray-400 hover:scale-110 cursor-pointer"
						onClick={() => onOpenChange(true)}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
						/>
					</svg>
				</SheetTrigger>

				<SheetContent
					side="bottom"
					className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white max-h-fit w-full sm:max-w-[444px] mx-auto"
					style={{ height: "calc(var(--vh, 1vh) * 100)" }}
				>
					<SheetHeader className="flex items-center justify-center">
						<SheetTitle className="text-lg font-semibold">
							Report an Issue
						</SheetTitle>
						<SheetDescription className="text-sm text-gray-500">
							Let us know your concerns or feedback.
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-8 w-full flex flex-col items-center"
						>
							<FormField
								control={form.control}
								name="issue"
								render={({ field }) => (
									<FormItem className="w-full">
										<FormControl>
											<Textarea
												className="textarea max-h-32"
												placeholder="Tell us a little bit about the issue"
												{...field}
											/>
										</FormControl>

										<FormMessage className="error-message">
											{errors.issue?.message}
										</FormMessage>
									</FormItem>
								)}
							/>

							{/* Button should only appear if form is changed and valid */}
							{isChanged && (
								<Button
									className="bg-green-1 hover:opacity-80 w-3/4 mx-auto text-white mt-4"
									type="submit"
									disabled={!isValid || loading}
								>
									{loading ? (
										<Image
											src="/icons/loading-circle.svg"
											alt="Loading..."
											width={24}
											height={24}
											priority
										/>
									) : (
										"Submit Report"
									)}
								</Button>
							)}
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default ReportDialog;
