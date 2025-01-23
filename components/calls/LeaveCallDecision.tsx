import React from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";

const LeaveCallDecision = ({
	handleDecisionDialog,
	setShowDialog,
}: {
	handleDecisionDialog: any;
	setShowDialog: any;
}) => {
	return (
		<section>
			<Sheet open={true} onOpenChange={(open) => !open && setShowDialog(false)}>
				<SheetTrigger asChild>
					<Button className="hidden" />
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="bg-white text-black rounded-t-xl p-5 flex flex-col items-start justify-between gap-7 max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<SheetHeader className="flex flex-col items-start justify-center">
						<SheetTitle>Leaving the call?</SheetTitle>
						<SheetDescription>
							Proceeding further will disconnect you from the call.
						</SheetDescription>
					</SheetHeader>

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
							Proceed
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default LeaveCallDecision;
