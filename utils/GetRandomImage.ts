const GetRandomImage = () => {
	// random profile image
	let imageList = [
		"https://firebasestorage.googleapis.com/v0/b/flashcall-e4f30.appspot.com/o/1.png?alt=media&token=309d5a94-8beb-43ec-bf20-3cb1784e400d",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-e4f30.appspot.com/o/2.png?alt=media&token=c83f3d5f-8932-43ff-ae8c-97651dbb64b6",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-e4f30.appspot.com/o/3.png?alt=media&token=cca70a0a-969d-4ae0-9f6f-4344ba63f7dc",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-e4f30.appspot.com/o/4.png?alt=media&token=bae5b053-d36a-4159-9ecc-b228f7dafa7b",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-e4f30.appspot.com/o/5.png?alt=media&token=ccdee857-5c70-4ad7-ae92-55b49f348cfc",
		"https://firebasestorage.googleapis.com/v0/b/flashcall-e4f30.appspot.com/o/6.png?alt=media&token=a7185173-f99d-4af7-ba4d-3be828df9dfb",
	];
	let randomImage = "";

	const randomIndex = Math.floor(Math.random() * imageList.length);
	randomImage = imageList[randomIndex];

	return randomImage;
};

export default GetRandomImage;
