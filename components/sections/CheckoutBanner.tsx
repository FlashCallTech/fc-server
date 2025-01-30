// section 4

import React from "react";

const CheckoutBanner = () => {
	const theme = `5px 5px 5px 0px #232323`;
	return (
		<section className="w-full h-fit pb-10 md:pb-20 bg-white grid grid-cols-1 text-center md:text-start md:grid-cols-2 gap-10 items-center md:px-14 lg:px-24 max-md:px-4">
			{/* heading and content */}

			<h2 className="text-3xl md:text-4xl font-semibold !leading-relaxed">
				Withdraw your earnings instantly to your bank account
			</h2>

			{/* banner */}
			<div className="bg-[#F9FAFB] rounded-[12px] p-4 md:px-14 md:py-10">
				<div className="flex flex-col w-full items-center justify-center gap-4 bg-white rounded-[12px] p-7">
					<div className="w-full flex flex-col items-center justify-center">
						<p className="text-sm">Welcome, </p>
						<span className="text-lg font-semibold">Nitra Sahgal</span>
					</div>
					<div className="w-full flex flex-col items-center justify-center border border-[#CBD5E1] rounded-[12px] px-4 py-3">
						<p className="text-xs">Wallet Balance</p>
						<span className="text-2xl text-green-1 font-bold">₹ 4500.00</span>
					</div>

					<p className="px-4 py-2 bg-green-1 text-white w-full rounded-md text-center text-sm font-semibold">
						Withdraw
					</p>
				</div>
			</div>
		</section>
	);
};

export default CheckoutBanner;
