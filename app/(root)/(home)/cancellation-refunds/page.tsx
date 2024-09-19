import React from "react";
import { conditions } from "../../../../constants/services/CancellationRefund.json";

const CancellationRefunds = () => {
	return (
		<section className="w-full h-fit py-7 pb-24 bg-white flex flex-col gap-4 items-center justify-start md:px-14 lg:px-24 px-4">
			{/* page title */}
			<h1 className="text-3xl font-medium mt-4 mb-7">{conditions.title}</h1>
			<ul className="flex flex-col items-start justify-center gap-4 px-2">
				{conditions.terms1.map((term, index) => (
					<li key={index} className="list-disc">
						{term}
					</li>
				))}
			</ul>

			<li className="list-disc -ml-4">{conditions.terms2.description}</li>
			<ul className="flex flex-col items-start justify-center gap-4 pl-7">
				{conditions.terms2.terms.map((term, index) => (
					<li key={index} className="list-disc">
						{term}
					</li>
				))}
			</ul>

			<ul className="flex flex-col items-start justify-center gap-4 px-2">
				{conditions.terms3.map((term, index) => (
					<li key={index} className="list-disc">
						{term}
					</li>
				))}
			</ul>
		</section>
	);
};

export default CancellationRefunds;
