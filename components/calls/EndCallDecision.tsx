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
import SinglePostLoader from "../shared/SinglePostLoader";

const EndCallDecision = ({
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
					className="bg-white text-black rounded-t-xl p-7 flex flex-col items-start justify-between gap-4 min-h-[200px] max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<SheetHeader className="flex flex-col items-start justify-center">
						<SheetTitle>Are you sure?</SheetTitle>
						<SheetDescription>
							Proceeding further will End the Ongoing Call.
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

export default EndCallDecision;
