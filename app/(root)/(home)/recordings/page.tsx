import CallList from "@/components/shared/CallList";

const RecordingsPage = () => {
	return (
		<section className="flex size-full flex-col gap-10  px-4">
			<h1 className="text-3xl font-bold">Recorded Calls</h1>

			<CallList type="recordings" />
		</section>
	);
};

export default RecordingsPage;
