"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SiginUpPage() {
	const searchParams = useSearchParams();
	const userType = searchParams.get("usertype");
	return (
		<main className="flex h-screen w-full items-end sm:items-center justify-center  bg-black/20 no-scrollbar overflow-hidden">
			<div className="animate-enterFromBottom">
				<SignUp
					fallbackRedirectUrl={"http://localhost:3000/updateDetails"}
					unsafeMetadata={{
						userType: (userType as string) ?? "client",
					}}
				/>
			</div>
		</main>
	);
}
