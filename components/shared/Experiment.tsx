import React from "react";
import EndScheduledCallDecision from "../calls/EndScheduledCallDecision";

const Experiment = () => {
	return (
		<>
			<EndScheduledCallDecision
				handleDecisionDialog={() => console.log("nice")}
				setShowDialog={() => "nice"}
			/>
		</>
	);
};

export default Experiment;
