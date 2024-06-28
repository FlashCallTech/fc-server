import CallListMobile from "@/components/calls/CallListMobile";
// import CallList from "@/components/calls/CallList";

const PreviousPage = () => {
	return (
		<section className="flex size-full flex-col gap-2 pb-5 md:py-0">
			<h1 className="sticky top-16 bg-white z-30 w-full px-4 py-4 pt-6 text-3xl font-bold">
				Order History
			</h1>
			<CallListMobile />
			{/* <CallList type="ended" /> */}
		</section>
	);
};

export default PreviousPage;
