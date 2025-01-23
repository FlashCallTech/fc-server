import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

const EndScheduledCallDecision = ({
	handleDecisionDialog,
	setShowDialog,
}: {
	handleDecisionDialog: any;
	setShowDialog: any;
}) => {
	return (
		<section>
			<Dialog
				open={true}
				onOpenChange={(open) => !open && setShowDialog(false)}
			>
				<DialogTrigger asChild>
					<Button className="hidden" />
				</DialogTrigger>
				<DialogContent className="bg-white text-black rounded-xl p-5 flex flex-col items-start justify-between gap-7 max-h-fit w-full max-w-[95%] sm:max-w-[444px] mx-auto">
					<DialogHeader className="flex flex-col items-start justify-start text-start">
						<DialogTitle>Session Time Up</DialogTitle>
						<DialogDescription>
							The session time has expired. <br />
							Are you sure you want to end the ongoing call?
						</DialogDescription>
					</DialogHeader>

					<div className="flex w-full items-center justify-start gap-2">
						<Button
							onClick={() => setShowDialog(false)}
							className="text-white bg-gray-500 font-semibold hover:opacity-80"
						>
							Cancel
						</Button>
						<Button
							onClick={handleDecisionDialog}
							className="text-white bg-red-500 font-semibold hover:opacity-80"
						>
							End Session
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</section>
	);
};

export default EndScheduledCallDecision;
