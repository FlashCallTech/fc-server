import React, { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";

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

const PixelIntegration = () => {
	const [isChanged, setIsChanged] = useState(false);

	// Explicitly define the type for initialState
	const initialState: {
		pixelId: string;
		accessToken: string;
	} = {
		pixelId: "",
		accessToken: "",
	};

	// Use the same type for form values
	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: {
			pixelId: "",
			accessToken: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);
	}

	const { formState } = form;
	const { errors, isValid } = formState;

	// Explicitly type watchedValues to match the form's field types
	const watchedValues = useWatch({ control: form.control }) as {
		pixelId: string;
		accessToken: string;
	};

	useEffect(() => {
		// Use a typed object for comparison
		const hasChanged = Object.keys(watchedValues).some((key) => {
			// TypeScript now understands this comparison
			return (
				watchedValues[key as keyof typeof watchedValues] !==
				initialState[key as keyof typeof initialState]
			);
		});
		setIsChanged(hasChanged);
	}, [watchedValues, initialState]);

	return (
		<section className="flex flex-col justify-between border rounded-lg bg-white p-4 shadow-sm">
			<div className="flex flex-row justify-between items-center pt-2 pb-4 border-b">
				<span className="font-semibold">Analytics Integration</span>
			</div>

			<span className="py-2 my-2 text-sm text-gray-400 ">
				Facebook Tracking
			</span>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid grid-cols-1 gap-5 items-center"
				>
					<FormField
						control={form.control}
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
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
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
								<FormMessage />
							</FormItem>
						)}
					/>
					{isChanged && isValid && (
						<Button
							className="text-base bg-green-1 hoverScaleDownEffect w-3/4 !mx-auto text-white"
							type="submit"
						>
							Submit
						</Button>
					)}
				</form>
			</Form>
		</section>
	);
};

export default PixelIntegration;
