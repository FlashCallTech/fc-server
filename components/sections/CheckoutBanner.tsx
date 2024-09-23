// section 4

import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";

const CheckoutBanner = () => {
	const theme = `5px 5px 5px 0px #232323`;
	return (
		<section className="w-full h-fit flex items-center justify-center py-14 bg-pattern bg-cover max-md:px-4">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-0 items-center md:px-14 md:py-7 bg-[#6D60F8] text-white w-full lg:w-4/5 rounded-xl ">
				<div className="flex flex-col items-center md:items-start justify-center gap-7 w-full p-4">
					<Image
						src="/web/images/rupee.png"
						alt="logo"
						width={100}
						height={100}
						className="rounded-xl w-auto h-auto"
					/>

					{/* heading and content */}
					<h2 className="text-4xl md:text-5xl font-semibold !leading-snug text-center md:text-start">
						Withdraw your earnings instantly to your bank account
					</h2>
				</div>
				{/* banner */}
				<Image
					src="/web/images/Checkout.png"
					alt="logo"
					width={2000}
					height={2000}
					className="hidden lg:block rounded-xl w-full h-full object-contain"
				/>
				<Image
					src="/web/images/checkoutMobile.png"
					alt="logo"
					width={2000}
					height={2000}
					className="lg:hidden rounded-xl w-full h-full object-contain"
				/>
			</div>
		</section>
	);
};

export default CheckoutBanner;
