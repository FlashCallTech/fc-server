import { SignIn } from "@clerk/nextjs";

export default function SiginInPage() {
	return (
		<main className="flex h-screen w-full items-end sm:items-center justify-center bg-black/20 no-scrollbar">
			<div className="animate-enterFromBottom sm:animate-none">
				<SignIn />
			</div>
		</main>
	);
}
