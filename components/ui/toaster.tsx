"use client";

import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(function ({
				id,
				title,
				description,
				toastStatus,
				action,
				...props
			}) {
				return (
					<Toast
						className="border-none text-white bg-[#121319]"
						key={id}
						{...props}
					>
						<div className={`flex items-center justify-start w-full gap-4`}>
							<ToastClose toastStatus={toastStatus} />
							<div className="w-full grid grid-cols-1 m-auto">
								{title && <ToastTitle>{title}</ToastTitle>}
								{description && (
									<ToastDescription>{description}</ToastDescription>
								)}
							</div>
						</div>
						{action}
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}
