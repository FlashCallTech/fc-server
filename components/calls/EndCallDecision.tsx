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
					className="bg-white text-black rounded-t-xl p-7 flex flex-col items-start justify-between gap-7 min-h-[200px] max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<SheetHeader className="flex flex-col items-start justify-center">
						<SheetTitle>Are you sure?</SheetTitle>
						<SheetDescription>
							Proceeding further will End the Ongoing Call.
						</SheetDescription>
					</SheetHeader>
					<div className="flex flex-col justify-center items-start gap-5 rounded-lg max-w-lg h-fit w-full mx-auto animate-pulse">
						<div className="flex items-center space-x-4 w-full">
							<div className="rounded-full bg-slate-300 h-12 w-12"></div>
							<div className="flex-1 space-y-4 py-1">
								<div className="h-3 bg-slate-300 rounded w-3/4"></div>
								<div className="space-y-3">
									<div className="grid grid-cols-3 gap-4">
										<div className="h-2 bg-slate-300 rounded col-span-2"></div>
										<div className="h-2 bg-slate-300 rounded col-span-1"></div>
									</div>
									<div className="h-2 bg-slate-300 rounded w-full"></div>
								</div>
							</div>
						</div>
					</div>
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
