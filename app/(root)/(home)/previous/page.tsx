import CallList from "@/components/calls/CallList";

const PreviousPage = () => {
	return (
		<section className="flex size-full flex-col gap-10 px-4 py-5 md:py-0">
			<h1 className="text-3xl font-bold">Previous Calls</h1>

			<CallList type="ended" />
		</section>
	);
};

export default PreviousPage;
