"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui//tooltip";
import Head from "next/head";

export default function SiginUpPage() {
	const searchParams = useSearchParams();
	const userType = searchParams.get("usertype");
	const [key, setKey] = useState(0);
	const router = useRouter();
	useEffect(() => {
		localStorage.setItem("userType", (userType as string) ?? "client");
	}, [router, searchParams, userType]);

	const handleRouting = (routeType: string) => {
		setKey((prevKey) => prevKey + 1);

		if (routeType === "client") {
			router.push("/sign-up");
		} else if (routeType === "creator") {
			router.push("/sign-up?usertype=creator");
		}
	};

	return (
		<main className="relative flex flex-col gap-5 h-screen w-full items-center justify-end md:justify-center bg-black/20 no-scrollbar overflow-hidden">
			<Head>
				<title>Register</title>
				<meta name="description" content="Registeration Form" />
				<link rel="icon" href="/icons/logoDarkCircle.png" />
			</Head>
			<div key={key} className="animate-enterFromBottom">
				<SignUp
					fallbackRedirectUrl={"http://localhost:3000/updateDetails"}
					unsafeMetadata={{
						userType: (userType as string) ?? "client",
					}}
				/>
			</div>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="fixed right-4 md:right-7 top-4 md:top-[90%] flex flex-col-reverse items-center justify-center gap-2 animate-pulse hover:animate-none ">
						<Button
							className="bg-green-1 text-white text-base rounded-xl mt-1 hoverScaleEffect flex items-center justify-center gap-2"
							onClick={() =>
								handleRouting(userType === "creator" ? "client" : "creator")
							}
						>
							<span>
								Authenticate as {userType === "creator" ? "Client" : "Expert"}
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
								/>
							</svg>
						</Button>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p className="text-black">Tap to Redirect</p>
				</TooltipContent>
			</Tooltip>
		</main>
	);
}
