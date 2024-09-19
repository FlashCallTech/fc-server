import Link from "next/link";
import React from "react";

const AboutUs = () => {
	return (
		<section className="w-full h-fit py-7 pb-24 bg-white flex flex-col gap-4 items-center justify-start md:px-14 lg:px-24 px-4">
			<h1 className="text-3xl font-medium mt-4 mb-7">About Us</h1>

			<section className="w-full h-fit flex flex-col gap-4 items-start justify-center">
				<h2 className="text-lg font-medium ">Welcome to Flashcall</h2>
				<div className="">
					<span>
						Flashcall is a platform where clients can avail consultation
						services from consultants. This privacy policy
					</span>
					<Link
						href="/privacy-policy"
						className="mx-1 text-[#50a65c] hover:underline underline-offset-2"
					>
						Privacy Policy
					</Link>
					<span>
						applies to clients, consultants, and all users of our platform, and
						is part of out Terms of Use. By using our platform, you agree that
						your personal information that you provide directly to us or that we
						collect through you use of the platform, may be transferred to and
						stored in the United States and handled as described in this policy.
					</span>
				</div>
			</section>
		</section>
	);
};

export default AboutUs;
