// last section

import React from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { queries } from "@/constants";

const Info = () => {
	// Split the queries into two columns for larger screens
	const midIndex = Math.ceil(queries.length / 2);
	const firstColumnQueries = queries.slice(0, midIndex);
	const secondColumnQueries = queries.slice(midIndex);
	const theme = `5px 5px 0px 0px #232323`;

	return (
		<section className="w-full h-fit py-10 md:py-20 bg-white grid grid-cols-1 gap-10 items-center md:px-14 lg:px-24 max-md:px-4">
			<h2 className="text-4xl md:text-5xl font-semibold !leading-relaxed">
				Frequently Asked Questions
			</h2>

			{/* queries on small screens */}
			<div className="grid grid-cols-1 md:hidden items-start justify-center md:gap-20">
				<Accordion type="single" collapsible>
					{queries.map((query, index) => (
						<AccordionItem
							key={index}
							value={`item-${index}`}
							className="mb-7 border-2 border-black rounded-lg"
							style={{
								boxShadow: theme,
							}}
						>
							<AccordionTrigger className="px-4 text-start text-sm">
								{query.label}
							</AccordionTrigger>
							<AccordionContent className="bg-black text-white p-4">
								{query.explanation}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>

			{/* queries on large screens */}
			<div className="hidden md:grid md:grid-cols-2 gap-10 w-full">
				<Accordion type="single" collapsible>
					{firstColumnQueries.map((query, index) => (
						<AccordionItem
							key={index}
							value={`item-${index}`}
							className="mb-7 border-2 border-black rounded-lg"
							style={{
								boxShadow: theme,
							}}
						>
							<AccordionTrigger className="px-4 text-start text-sm">
								{query.label}
							</AccordionTrigger>
							<AccordionContent className="bg-black text-white p-4">
								{query.explanation}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
				<Accordion type="single" collapsible>
					{secondColumnQueries.map((query, index) => (
						<AccordionItem
							key={index + midIndex}
							value={`item-${index + midIndex}`}
							className="mb-7 border-2 border-black rounded-lg"
							style={{
								boxShadow: theme,
							}}
						>
							<AccordionTrigger className="px-4 text-start text-sm">
								{query.label}
							</AccordionTrigger>
							<AccordionContent className="bg-black text-white p-4">
								{query.explanation}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
};

export default Info;
