const GetRandomImage = () => {
	// random profile image
	let imageList = [
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F1.png?alt=media&token=7b3352c2-d1a6-4a4f-907f-7f044c8715ef",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F2.png?alt=media&token=69dc8a09-c0d7-4ba6-9e13-2de52b9e3097",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F3.png?alt=media&token=6e66536d-0966-4666-b0ed-e05e1686ae5b",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F4.png?alt=media&token=883d64d9-86e1-4472-aa4f-80ff379546b6",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F5.png?alt=media&token=0b7995ca-8767-4200-8f76-9a1746e3682c",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F6.png?alt=media&token=30ebdbd2-b626-4fff-a5c7-3973bea278de",
	];
	let randomImage = "";

	const randomIndex = Math.floor(Math.random() * imageList.length);
	randomImage = imageList[randomIndex];

	return randomImage;
};

export default GetRandomImage;
