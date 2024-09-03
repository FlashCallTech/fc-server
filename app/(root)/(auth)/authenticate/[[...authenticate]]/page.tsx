"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import Head from "next/head";
import AuthenticateViaOTP from "@/components/forms/AuthenticateViaOTP";

export default function AuthenticationPage() {
	const searchParams = useSearchParams();
	const userType = searchParams.get("usertype");

	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<main
			style={{ height: "calc(var(--vh, 1vh) * 100)" }}
			className="relative flex flex-col gap-5 w-full items-center justify-end md:justify-center bg-green-1 no-scrollbar overflow-hidden"
		>
			<Head>
				<title>Authentication</title>
				<meta name="description" content="Authentication Form" />
				<link rel="icon" href="/icons/logoDarkCircle.png" />
			</Head>
			<div className="animate-enterFromBottom">
				<AuthenticateViaOTP userType={userType as string} />
			</div>
		</main>
	);
}
