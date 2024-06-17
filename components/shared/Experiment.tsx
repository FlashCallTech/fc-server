"use client";

import React, { useEffect, useState } from "react";
import { Cursor, Typewriter } from "react-simple-typewriter";

const Experiment = () => {
	const [showWarning, setShowWarning] = useState(false);

	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		setShowWarning(true);
		event.returnValue = ""; // This triggers the browser's confirmation dialog.
	};

	const handleUnload = () => {
		console.log("User has left the page");
		// Add any action you want to perform when the user leaves the page
	};

	useEffect(() => {
		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("unload", handleUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("unload", handleUnload);
		};
	}, []);

	return (
		<section className="w-full h-full flex flex-col items-center justify-center gap-2">
			{showWarning && (
				<>
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
					<h1 className="text-2xl font-semibold mt-7">
						<Typewriter
							words={["Processing Transactions Requests", "Please Wait ..."]}
							loop={true}
							cursor
							cursorStyle="_"
							typeSpeed={50}
							deleteSpeed={50}
							delaySpeed={2000}
						/>
						<Cursor cursorColor="#50A65C" />
					</h1>
				</>
			)}
		</section>
	);
};

export default Experiment;
