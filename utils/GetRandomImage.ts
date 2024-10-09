const GetRandomImage = () => {
	// random profile image
	let imageList = [
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/1.png?alt=media&token=56609877-25b4-4367-9a3e-4e0be7b7a5f6",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/2.png?alt=media&token=04ab2555-d4a1-46dc-9e2a-106ef7bacc5d",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/3.png?alt=media&token=9f519292-2d02-46ef-8828-014c77ec82a9",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/4.png?alt=media&token=48860391-b890-4bda-b533-f4fab7399f1b",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/5.png?alt=media&token=0138c7a5-7774-4562-acef-b62b1ab7b4f7",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/6.png?alt=media&token=f9caef16-50a9-4572-bc9d-6d402fa8c066",
	];
	let randomImage = "";

	const randomIndex = Math.floor(Math.random() * imageList.length);
	randomImage = imageList[randomIndex];

	return randomImage;
};

export default GetRandomImage;
