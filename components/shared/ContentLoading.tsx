import React from "react";

const ContentLoading = () => {
	return (
		<div className="flex flex-col justify-center items-start gap-5 rounded-lg px-6 py-4 max-w-lg h-fit w-full mx-auto animate-pulse">
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
			<div className="flex-1 space-y-4 py-1 w-full">
				<div className="h-3 bg-slate-300 rounded w-full"></div>
				<div className="space-y-3">
					<div className="grid grid-cols-3 gap-4">
						<div className="h-2 bg-slate-300 rounded col-span-2"></div>
						<div className="h-2 bg-slate-300 rounded col-span-1"></div>
					</div>
					<div className="h-2 bg-slate-300 rounded w-full"></div>
					<div className="h-2 bg-slate-300 rounded w-3/4"></div>
				</div>
			</div>
		</div>
	);
};

export default ContentLoading;
