import React from "react";
import Link from "next/link";
import { terms } from "../../../../constants/services/TermsOfServices.json";

const TermsOfServices = () => {
	const aboutPlatform = terms.aboutPlatform;
	const tableOfContents = terms.tableOfContents;
	return (
		<section className="w-full h-fit py-7 pb-24 bg-white flex flex-col gap-4 items-center justify-start md:px-12 lg:px-24 max-md:px-4">
			{/* page title */}
			<h1 className="text-3xl font-medium mt-4">Terms of Services</h1>
			{/* subheading */}
			<h2 className="text-lg">BHHI Technologies Pvt. Ltd.</h2>
			<h2 className="text-lg mb-7">Last Updated: 21st August 2024</h2>

			{/* first para */}
			<section className="w-full">
				<span>
					This document sets out the terms and conditions for use of domains,
					flashcall.me (the &quot;Site&quot;) and any features, subdomains,
					content, functionality, services, media, applications, Discussion
					Forums, or solutions offered on or through the Site (collectively
					referred to as the &quot;Platform&quot;). These terms and conditions
					apply to individuals who provide services on the Platform (referred to
					as &quot;consultants&quot;) and end users on the Platform (referred to
					as &quot;Clients&quot;) collectively (&quot;You&quot;,
					&quot;Your&quot;, or &quot;User(s)&quot;). Unless otherwise
					specifically stated, the terms &quot;You&quot;, &quot;Your&quot;, or
					&quot;User&quot; shall refer to you, the user of the Platform or any
					legal entity for whom you are an authorized employee or agent on
					behalf of when you are using or accessing the Platform and includes
					all consultants and Clients. These terms and conditions including the
				</span>
				<Link
					href="/privacy-policy"
					className="mx-1 text-[#50a65c] hover:underline underline-offset-2"
				>
					Privacy Policy
				</Link>
				{","}
				<Link
					href="/platform-guidelines"
					className="mx-1 text-[#50a65c] hover:underline underline-offset-2"
				>
					Platform Guidelines
				</Link>
				<span>
					and Data Processing Agreement (collectively referred to as the
					&quot;Agreement&quot;), define the relationship and responsibilities
					between You and Flashcall (as defined herein) in using the Platform.
					Your access to the Platform is subject to Your acceptance and
					agreement of these terms and conditions. Hence, please take Your time
					to read this Agreement. When we speak of &apos;Flashcall&apos; ,
					&apos;we&apos;, &apos;us&apos;, and &apos;our&apos;, we mean Flashcall
					- a company incorporated in India. Please read the Agreement and all
					other rules and policies made available or published on the Platform
					as they shall govern Your use of the Platform and the services offered
					therein. From time-to-time, versions of the above-mentioned policies
					and terms are made available on the Platform for Your reference and to
					understand how we handle Your personal information. By using or
					visiting the Platform and services provided to You on, from, or
					through the Platform, or by clicking the button during the
					registration process to create an account on the Platform, You are
					expressly agreeing to the terms of the Agreement and any other terms
					that are updated from time to time. If You do not agree to any of
					these terms or do not wish to be bound by the same, please do not use
					the Platform in any manner. By entering into this Agreement, You
					represent and warrant that You have full power and authority to enter
					into this Agreement and doing so will not violate any other agreement
					which You are a party.
				</span>
			</section>
			{/* About Platform */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium ">{aboutPlatform.title}</h2>
				<p>
					{aboutPlatform.para1} (<strong>Flashcall Features</strong>)
				</p>
				<p>
					{aboutPlatform.para2} <strong>&quot;Flashcall Features&quot;</strong>{" "}
					or <strong>&quot;Services&quot;</strong> under this Agreement.
				</p>
				<p>{aboutPlatform.para3} </p>
				<p className="whitespace-pre-line">{aboutPlatform.para4} </p>
			</section>

			{/* Table of Contents */}
			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10">
				<h2 className="text-lg font-medium ">{tableOfContents.title}</h2>
				<ul className="flex flex-col items-start justify-center gap-4 pl-4">
					{tableOfContents.contents.map((content, index) => (
						<li
							key={index}
							className="text-[#50a65c] hover:underline underline-offset-2"
						>
							<Link href={`#${content.split(". ")[0]}`}>{content}</Link>
						</li>
					))}
				</ul>
			</section>

			{/* Content A */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="A"
			>
				<h2 className="text-lg font-medium ">A. {terms.A.title}</h2>
				<p>
					{terms.A.para1} <strong>(the &apos;Registration&apos;)</strong>.
				</p>
				<p>
					{terms.A.para2}{" "}
					<strong>
						{" "}
						If You are under the age of 13 years, You may neither use our
						Platform in any manner nor may You register for an account.
					</strong>
				</p>
				<p>{terms.A.para3}</p>

				<section>
					{terms.A.para4}{" "}
					<Link
						href="/privacy-policy"
						className="mx-1 text-[#50a65c] hover:underline underline-offset-2"
					>
						Privacy Policy
					</Link>
					{terms.A.para5}
				</section>

				<p>{terms.A.para6}</p>
			</section>

			{/* Content B */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="B"
			>
				<h2 className="text-lg font-medium ">B. {terms.B.title}</h2>

				<p>{terms.B.para1}</p>
				<p>{terms.B.para2}</p>
				<p>{terms.B.para3}</p>
				<p>{terms.B.para4}</p>
			</section>

			{/* Content C */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="C"
			>
				<h2 className="text-lg font-medium ">C. {terms.C.title}</h2>

				<p>{terms.C.para1}</p>
			</section>

			{/* Content D */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="D"
			>
				<h2 className="text-lg font-medium ">D. {terms.D.title}</h2>

				<p>{terms.D.para1}</p>
			</section>

			{/* Content E */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="E"
			>
				<h2 className="text-lg font-medium ">E. {terms.E.title}</h2>

				<p>{terms.E.para1}</p>
				<p>{terms.E.para2}</p>
				<p>{terms.E.para3}</p>
				<p>{terms.E.para4}</p>
			</section>

			{/* Content F */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="F"
			>
				<h2 className="text-lg font-medium ">F. {terms.F.title}</h2>

				<p>{terms.F.para1}</p>
			</section>

			{/* Content G */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="G"
			>
				<h2 className="text-lg font-medium ">G. {terms.G.title}</h2>

				<p>{terms.G.para1}</p>
			</section>

			{/* Content H */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="H"
			>
				<h2 className="text-lg font-medium">H. {terms.H.title}</h2>

				{/* Legit Usage */}
				<p className="font-medium mt-2">{terms.H.conducts.legitUsage.title}</p>
				<p>{terms.H.conducts.legitUsage.description}</p>

				{/* Communication */}
				<p className="font-medium mt-2">
					{terms.H.conducts.communication.title}
				</p>
				<p>{terms.H.conducts.communication.description}</p>

				{/* Hateful Communication */}
				<p className="font-medium mt-2">
					{terms.H.conducts.hatefulCommunication.title}
				</p>
				<p>{terms.H.conducts.hatefulCommunication.description}</p>

				{/* Violent Communication */}
				<p className="font-medium mt-2">
					{terms.H.conducts.voilentCommunication.title}
				</p>
				<p>{terms.H.conducts.voilentCommunication.description}</p>

				{/* Harassment */}
				<p className="font-medium mt-2">{terms.H.conducts.harassment.title}</p>
				<p>{terms.H.conducts.harassment.description}</p>

				{/* Spam */}
				<p className="font-medium mt-2">{terms.H.conducts.spam.title}</p>
				<p>{terms.H.conducts.spam.description}</p>

				{/* Scams */}
				<p className="font-medium mt-2">{terms.H.conducts.scams.title}</p>
				<p>{terms.H.conducts.scams.description}</p>

				{/* Violation */}
				<p className="font-medium mt-2">{terms.H.conducts.violation.title}</p>
				<p>{terms.H.conducts.violation.description}</p>

				{/* Impersonation */}
				<p className="font-medium mt-2">
					{terms.H.conducts.impersonation.title}
				</p>
				<p>{terms.H.conducts.impersonation.description}</p>

				{/* Access */}
				<p className="font-medium mt-2">{terms.H.conducts.access.title}</p>
				<p>{terms.H.conducts.access.description}</p>
				<p>{terms.H.conducts.access.moreInfo}</p>
			</section>

			{/* Content I */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="I"
			>
				<h2 className="text-lg font-medium ">I. {terms.I.title}</h2>

				<p>
					<strong>{terms.I.flashcallContent.title}:</strong>{" "}
					{terms.I.flashcallContent.para1}{" "}
					<strong>(&apos;Flashcall Content&apos;).</strong>{" "}
					{terms.I.flashcallContent.para2}
				</p>
				<p>{terms.I.flashcallContent.para2}</p>
				<p>{terms.I.flashcallContent.para3}</p>

				<p>
					<strong>{terms.I.yourContent.title}:</strong>{" "}
					{terms.I.yourContent.description}
				</p>
			</section>

			{/* Content J */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="J"
			>
				<h2 className="text-lg font-medium ">J. {terms.J.title}</h2>

				<p className="whitespace-pre-line">{terms.J.para1}</p>
				<p className="whitespace-pre-line">{terms.J.para2}</p>
				<p className="whitespace-pre-line">{terms.J.para3}</p>
			</section>

			{/* Content K */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="K"
			>
				<h2 className="text-lg font-medium ">K. {terms.K.title}</h2>

				<p className="whitespace-pre-line">
					{terms.K.para1} <strong>(&apos;Feedback&apos;)</strong> {", "}
					{terms.K.para2}
				</p>
			</section>

			{/* Content L */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="L"
			>
				<h2 className="text-lg font-medium ">L. {terms.L.title}</h2>

				<p className="whitespace-pre-line">{terms.L.para1}</p>
				<p className="whitespace-pre-line">{terms.L.para2}</p>
				<p className="whitespace-pre-line">{terms.L.para3}</p>
				<p className="whitespace-pre-line">{terms.L.para4}</p>
				<p className="whitespace-pre-line">{terms.L.para5}</p>
			</section>

			{/* Content M */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="M"
			>
				<h2 className="text-lg font-medium ">M. {terms.M.title}</h2>
				<p className="whitespace-pre-line">
					<span className="underline underline-offset-2">
						Copyright Complaints
					</span>
					{": "}
					{terms.M.description}
				</p>
				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{terms.M.infomation.map((info, index) => (
						<li key={index} className="list-disc">
							{info}
						</li>
					))}
				</ul>
				<p className="whitespace-pre-line">{terms.M.para1}</p>

				<p className="whitespace-pre-line">
					<span className="underline underline-offset-2">Counter-Notice</span>
					{": "}
					{terms.M.counterNotice.description}
				</p>
				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{terms.M.counterNotice.points.map((info, index) => (
						<li key={index} className="list-disc">
							{info}
						</li>
					))}
				</ul>

				<p className="whitespace-pre-line">
					{terms.M.counterNotice.endingPara}
				</p>

				<p className="whitespace-pre-line">
					<span className="underline underline-offset-2">
						{terms.M.repeatInfringer.title}
					</span>
					{": "}
					{terms.M.repeatInfringer.description}
				</p>
			</section>

			{/* Content N */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="N"
			>
				<h2 className="text-lg font-medium ">N. {terms.N.title} </h2>

				<p className="whitespace-pre-line">{terms.N.para1} </p>
				<p className="whitespace-pre-line">
					{terms.N.para2} (For copyright complaints, please refer to{" "}
					<span className="underline underline-offset-2">
						&apos;Copyright Complaints and Takedown Policy&apos;
					</span>{" "}
					section above). {terms.N.para3}
				</p>
			</section>

			{/* Content O */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="O"
			>
				<h2 className="text-lg font-medium ">O. {terms.O.title} </h2>

				<p className="whitespace-pre-line">{terms.O.description} </p>
			</section>

			{/* Content O */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="O"
			>
				<h2 className="text-lg font-medium ">O. {terms.O.title} </h2>

				<p className="whitespace-pre-line">{terms.O.description} </p>
			</section>

			{/* Content P */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="P"
			>
				<h2 className="text-lg font-medium ">P. {terms.P.title} </h2>

				<p className="whitespace-pre-line">
					<strong>{terms.P.services.pricing.title}</strong>
					{": "}
					{terms.P.services.pricing.para1} (referred to as the{" "}
					<strong>&apos;consultant Fee&apos;</strong>) at their sole discretion
					and Flashcall is not responsible for the same.
				</p>

				<p className="whitespace-pre-line">
					<strong>{terms.P.services.charges.title}</strong>
					{": "}
					{terms.P.services.charges.para1} (referred to as the{" "}
					<strong>&apos;Platform Service Charge&apos;</strong>{" "}
					{terms.P.services.charges.para2})
				</p>

				<p className="whitespace-pre-line">
					<strong>{terms.P.services.payments.title}</strong>
					{": "}
					{terms.P.services.payments.para1}
				</p>

				<p>{terms.P.services.payments.para2}</p>

				<p className="whitespace-pre-line">
					<strong>{terms.P.services.payments.types.type1.title}</strong>
					{": "} {terms.P.services.payments.types.type1.para1}
				</p>
				<p>{terms.P.services.payments.types.type1.para2}</p>
				<p>
					<strong>For consultants based in India, </strong>
					{terms.P.services.payments.types.type1.para3}
				</p>

				<p>
					<strong>
						In case you have failed to furnish the GST registration certificate
						to Flashcall after crossing the threshold exemption on Flashcall
						platform,
					</strong>
				</p>

				<ul className="flex flex-col items-start justify-center gap-4 pl-7">
					{terms.P.services.payments.types.type1.bulletPoints.map(
						(info, index) => (
							<li key={index} className="list-disc">
								{info}
							</li>
						)
					)}
				</ul>

				<p className="whitespace-pre-line">
					<strong>{terms.P.services.payments.types.type2.title}</strong>
					{": "} {terms.P.services.payments.types.type2.para1}
				</p>
			</section>

			{/* Content Q */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="Q"
			>
				<h2 className="text-lg font-medium ">Q. {terms.Q.title} </h2>

				<p className="whitespace-pre-line">{terms.Q.description} </p>
			</section>

			{/* Content R */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="R"
			>
				<h2 className="text-lg font-medium ">R. {terms.R.title} </h2>

				<p className="whitespace-pre-line">{terms.R.description} </p>
			</section>

			{/* Content T */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="T"
			>
				<h2 className="text-lg font-medium ">T. {terms.T.title} </h2>

				<p className="whitespace-pre-line">{terms.T.description} </p>
			</section>

			{/* Content U */}

			{/* Content V */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="V"
			>
				<h2 className="text-lg font-medium ">V. {terms.V.title} </h2>

				<p className="whitespace-pre-line">{terms.V.description} </p>
			</section>

			{/* Content W */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="W"
			>
				<h2 className="text-lg font-medium ">W. {terms.W.title} </h2>

				<p className="whitespace-pre-line">{terms.W.description} </p>
			</section>

			{/* Content X */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="X"
			>
				<h2 className="text-lg font-medium ">X. {terms.X.title} </h2>

				<p className="whitespace-pre-line">{terms.X.para1} </p>
				<p className="whitespace-pre-line">{terms.X.para2} </p>
			</section>

			{/* Content Y */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="Y"
			>
				<h2 className="text-lg font-medium ">Y. {terms.Y.title} </h2>

				<p className="whitespace-pre-line font-medium mt-2">
					{terms.Y.heading1}{" "}
				</p>
				<p className="whitespace-pre-line">{terms.Y.description1} </p>

				<p className="whitespace-pre-line font-medium mt-2">
					{terms.Y.heading2}{" "}
				</p>
				<p className="whitespace-pre-line">{terms.Y.description2} </p>

				<p className="whitespace-pre-line font-medium mt-2">
					{terms.Y.heading3}{" "}
				</p>
				<p className="whitespace-pre-line">{terms.Y.description3} </p>

				<p className="whitespace-pre-line font-medium mt-2">
					{terms.Y.heading4}{" "}
				</p>
				<p className="whitespace-pre-line">{terms.Y.description4} </p>

				<p className="whitespace-pre-line font-medium mt-2">
					{terms.Y.heading5}{" "}
				</p>
				<p className="whitespace-pre-line">{terms.Y.description5} </p>
			</section>

			{/* Content Z */}
			<section
				className="w-full h-fit flex flex-col gap-4 items-start justify-center mt-10"
				id="Z"
			>
				<h2 className="text-lg font-medium ">Z. {terms.Z.title} </h2>
				<p>{terms.Z.description}</p>

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

export default TermsOfServices;
