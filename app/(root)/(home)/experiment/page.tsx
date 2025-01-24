"use client";

import EndScheduledCallDecision from "@/components/calls/EndScheduledCallDecision";
import React from "react";

const Experiment = () => {
	return (
		<>
			<EndScheduledCallDecision
				handleDecisionDialog={() => console.log("nice")}
				setShowDialog={(nice: boolean) => "nice"}
			/>
		</>
	);
};

export default Experiment;
