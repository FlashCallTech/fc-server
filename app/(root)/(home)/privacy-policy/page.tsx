import React from "react";
import { policies } from "../../../../constants/services/PrivacyPolicy.json";
const PrivacyPolicy = () => {
	const welcome = policies.welcomeMessage;
	const infoProvidedByYou = policies.informationProvideByYou;
	const clients = policies.clients;
	const consultants = policies.consultants;
	const additionalInfo = policies.additionalInfo;
	const infoUsage = policies.infoUsage;
	const infoSharing = policies.infoSharing;
	const infoSecurity = policies.infoSecurity;
	const cookies = policies.cookies;
	const redressal = policies.redressal;

	return (
		<section className="w-full h-fit py-7 pb-24 bg-white flex flex-col gap-4 items-center justify-start md:px-14 lg:px-24 max-md:px-4">
			{/* page title */}
			<h1 className="text-3xl font-medium mt-4 mb-7">Privacy Policy</h1>
			{/* Welcome Message */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center">
				<h2 className="text-lg font-medium ">{welcome.title}</h2>
				<p>{welcome.description}</p>
			</section>

			{/* Information You Provide Through Your Account */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{infoProvidedByYou.title}</h2>
				<p>{infoProvidedByYou.description}</p>

				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{infoProvidedByYou.collecteInfo.map((info, index) => (
						<li key={index} className="list-disc">
							{info}
						</li>
					))}
				</ul>
				<p>{infoProvidedByYou.endingPara}</p>
			</section>

			{/* Clients */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{clients.title}</h2>
				<p>{clients.para1}</p>
				<p>{clients.para2}</p>
			</section>

			{/* Consultants */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{consultants.title}</h2>
				<p>{consultants.para1}</p>
				<p>{consultants.para2}</p>

				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{consultants.details.map((detail, index) => (
						<li key={index} className="list-disc">
							{detail}
						</li>
					))}
				</ul>
			</section>

			{/* Additional Info we collect */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{additionalInfo.title}</h2>
				<p>{additionalInfo.para1}</p>
				<p>{additionalInfo.para2}</p>
			</section>

			{/* Info Usage */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{infoUsage.title}</h2>
				<p>{infoUsage.description}</p>
				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{infoUsage.purposes.map((purpose, index) => (
						<li key={index} className="list-disc">
							{purpose}
						</li>
					))}
				</ul>{" "}
			</section>

			{/* Info Sharing */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{infoSharing.title}</h2>
				<p>{infoSharing.description}</p>
				<p>{infoSharing.circumstances}</p>
				{/* Info Sharing with Consultants */}
				<h2 className="text-lg font-medium mt-10">
					{infoSharing.infoSharingWithConsultatnts.title}
				</h2>
				<p>{infoSharing.infoSharingWithConsultatnts.infoShared.description}</p>
				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{infoSharing.infoSharingWithConsultatnts.infoShared.info.map(
						(info, index) => (
							<li key={index} className="list-disc">
								{info}
							</li>
						)
					)}
				</ul>{" "}
			</section>

			{/* Info Security*/}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{infoSecurity.title}</h2>
				<p>{infoSecurity.para1}</p>
				<p>{infoSecurity.para2}</p>
				<p>{infoSecurity.para3}</p>
			</section>

			{/* Cookies */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{cookies.title}</h2>
				<p>{cookies.para1}</p>
				<p>{cookies.para2}</p>
			</section>

			{/* Redressal */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium">{redressal.title}</h2>
				<p>{redressal.description}</p>

				<a
					href="mailto:support@Flashcall.me"
					className="text-[#50a65c] hoverScaleDownEffect"
				>
					support@Flashcall.me
				</a>
			</section>
		</section>
	);
};

export default PrivacyPolicy;
