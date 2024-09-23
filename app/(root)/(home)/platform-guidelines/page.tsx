import React from "react";
import { guidelines } from "../../../../constants/services/PlatformGuidelines.json";

const PlatformGuidelines = () => {
	const enforcements = guidelines.enforcement;
	const harassment = guidelines.bullyingHarassment;
	const contentRestrictions = guidelines.contentRestrictions;
	const clientAccounts = guidelines.clientAccounts;

	return (
		<section className="w-full h-fit py-7 pb-24 bg-white flex flex-col gap-4 items-center justify-start md:px-14 lg:px-24 max-md:px-4">
			{/* page title */}
			<h1 className="text-3xl font-medium mt-4 mb-7">Platform Guidelines</h1>

			{/* How these guidelines are enforced */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center">
				<h2 className="text-lg font-medium ">{enforcements.title}</h2>
				<p>{enforcements.description.para1}</p>
				<p>{enforcements.description.para2}</p>
				<p>{enforcements.description.para3}</p>

				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{enforcements.description.conditions.map((condition, index) => (
						<li key={index} className="list-disc">
							{condition}
						</li>
					))}
				</ul>
			</section>

			{/* Bullying, Harassment and Threats */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{harassment.title}</h2>
				<p>{harassment.about}</p>

				{/* bullying */}
				<section className="flex flex-col items-start gap-2">
					<h2 className="text-base font-medium ">
						{harassment.sections.bullying.title}
					</h2>
					<p>{harassment.sections.bullying.content}</p>
				</section>
				{/* harassment */}
				<section className="flex flex-col items-start gap-2">
					<h2 className="text-Fbase font-medium ">
						{harassment.sections.harassment.title}
					</h2>
					<p>{harassment.sections.harassment.content}</p>
				</section>
				{/* hateSpeech */}
				<section className="flex flex-col items-start gap-2">
					<h2 className="text-base font-medium ">
						{harassment.sections.hateSpeech.title}
					</h2>
					<p>{harassment.sections.hateSpeech.content}</p>
				</section>
			</section>

			{/* Content Restrictions */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				{/* 18+ Creations*/}
				<h2 className="text-lg font-medium">
					{contentRestrictions.sections["18Plus"].title}
				</h2>
				<p>{contentRestrictions.sections["18Plus"].content}</p>
				<ul className="flex flex-col items-start justify-center gap-4 px-2">
					{contentRestrictions.sections["18Plus"].categories.map(
						(category, index) => (
							<li key={index} className="flex flex-col items-start gap-2">
								<h2 className="text-base font-medium">{category.title}</h2>
								<p className="whitespace-pre-line">{category.description}</p>
							</li>
						)
					)}
				</ul>

				{/* People who cannot use FlashCall */}
				<h2 className="text-lg font-medium mt-10">
					{contentRestrictions.sections.whoCanUserFlashcall.title}
				</h2>

				<p>{contentRestrictions.sections.whoCanUserFlashcall.description}</p>

				<ul className="flex flex-col items-start justify-center gap-4 px-2">
					{contentRestrictions.sections.whoCanUserFlashcall.categories.map(
						(category, index) => (
							<li key={index} className="flex flex-col items-start gap-2">
								<h2 className="text-base font-medium">{category.title}</h2>
								<p className="whitespace-pre-line">{category.content}</p>
							</li>
						)
					)}
				</ul>
			</section>

			{/* Spam */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">
					{contentRestrictions.sections.spam.title}
				</h2>
				<p>{contentRestrictions.sections.spam.content}</p>

				<p>{contentRestrictions.sections.spam.prohibitedActions.title}</p>

				<ul className="flex flex-col items-start justify-center gap-2 pl-7">
					{contentRestrictions.sections.spam.prohibitedActions.actions.map(
						(action, index) => (
							<li key={index} className="list-disc">
								{action}
							</li>
						)
					)}
				</ul>

				<p>{contentRestrictions.sections.spam.endPara}</p>
			</section>

			{/* Client Accounts */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{clientAccounts.title}</h2>
				<p>{clientAccounts.para1}</p>
				<p>{clientAccounts.para2}</p>
				<p>{clientAccounts.para3}</p>
				<p>{clientAccounts.para4}</p>
				<p>{clientAccounts.para5}</p>

				<p>{clientAccounts.clientAccountsTerms.description}</p>

				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{clientAccounts.clientAccountsTerms.terms.map((term, index) => (
						<li key={index} className="list-disc">
							{term}
						</li>
					))}
				</ul>
			</section>
		</section>
	);
};

export default PlatformGuidelines;
