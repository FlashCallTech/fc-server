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
			className="fixed w-full z-50 inset-0 bg-green-1 top-0 flex flex-col items-center justify-end md:justify-center"
			style={{ height: "calc(var(--vh, 1vh) * 100)" }}
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
