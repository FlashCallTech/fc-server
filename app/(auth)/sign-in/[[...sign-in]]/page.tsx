import { SignIn } from "@clerk/nextjs";

export default function SiginInPage() {
	return (
		<main className="flex h-screen w-full items-end sm:items-center justify-center bg-black/20 no-scrollbar  overflow-hidden">
			<div className="animate-enterFromBottom">
				<SignIn />
			</div>
		</main>
	);
}
