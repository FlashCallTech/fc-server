const GetRandomImage = () => {
	// random profile image
	let imageList = [
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2F1.png?alt=media&token=cabe435d-bb0a-4ff0-babc-a0262a8bc06d",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2F2.png?alt=media&token=7a854ed9-48d2-4021-b4a2-d2423ce708a6",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2F3.png?alt=media&token=0fc7ea96-62db-4875-944c-5682f2178cdb",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2F4.png?alt=media&token=0881db3b-f1b4-4699-ae16-73b1b3b9dbcf",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2F5.png?alt=media&token=b8a25c64-6e06-4250-9417-fd95bdaddf1e",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2F6.png?alt=media&token=8c1f47cf-780d-4ffb-be7d-7a80000516e0",
	];
	let randomImage = "";

	const randomIndex = Math.floor(Math.random() * imageList.length);
	randomImage = imageList[randomIndex];

	return randomImage;
};

export default GetRandomImage;
