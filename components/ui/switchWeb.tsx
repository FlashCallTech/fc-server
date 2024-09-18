"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const SwitchWeb = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitives.Root>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
	<SwitchPrimitives.Root
		className={cn(
			"peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-1 data-[state=unchecked]:bg-input",
			className
		)}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb
			className={cn(
				"pointer-events-none block h-12 w-12 rounded-full bg-[#D9D9D9] shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[5rem] data-[state=unchecked]:translate-x-[2px]"
			)}
		/>
	</SwitchPrimitives.Root>
));
SwitchWeb.displayName = SwitchPrimitives.Root.displayName;

export { SwitchWeb };
