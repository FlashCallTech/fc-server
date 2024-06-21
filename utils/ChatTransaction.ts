import { getUserById } from "@/lib/actions/creator.actions";

export const handleTransaction = async ({
	duration,
}: {
	duration: string | undefined;
}) => {
	console.log("duration in handleTransaction", duration);
    if(!duration) return;

    const creatorId = "6675197dc56dfe13b3ccabd3";

	try {	
		const creator = await getUserById(creatorId)
		console.log(creator);
	} catch (error) {
		console.log(error)
	}

	

    // const amountToBePaid = ((parseInt(duration, 10) / 60) * rate).toFixed(2);
}