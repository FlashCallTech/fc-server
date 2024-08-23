"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Head from "next/head";
import AuthenticateViaOTP from "@/components/forms/AuthenticateViaOTP";

export default function AuthenticationPage() {
	const searchParams = useSearchParams();
	const userType = searchParams.get("usertype");
	const refId = searchParams.get("refId");
	const router = useRouter();
	useEffect(() => {
		localStorage.setItem("userType", (userType as string) ?? "client");
		if(refId){
			localStorage.setItem('refId', refId as string);
		}
	}, [router, searchParams, userType, refId]);


	return (
		<main className="relative flex flex-col gap-5 h-screen w-full items-center justify-end md:justify-center bg-green-1 no-scrollbar overflow-hidden">
			<Head>
				<title>Register</title>
				<meta name="description" content="Registeration Form" />
				<link rel="icon" href="/icons/logoDarkCircle.png" />
			</Head>
			<div className="animate-enterFromBottom">
				<AuthenticateViaOTP userType={userType as string} refId={refId as string}/>
			</div>
		</main>
	);
}
