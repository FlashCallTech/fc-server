const GetRandomImage = () => {
	// random profile image
	let imageList = [
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F1.png?alt=media&token=588c8270-189e-44d2-8947-21cbf3b04235",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F2.png?alt=media&token=4bfc0848-2041-4317-977e-27e47aafbb16",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F3.png?alt=media&token=b4b70fd8-528f-4bfe-8764-516013b4cee3",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F4.png?alt=media&token=e3b68092-d0da-4ec1-a613-409323930e26",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F5.png?alt=media&token=2011dc38-1a44-407f-bc74-894342910a9a",
		"https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2F6.png?alt=media&token=f978a1ed-2ae7-43e3-8d88-04933bc71e70",
	];
	let randomImage = "";

	const randomIndex = Math.floor(Math.random() * imageList.length);
	randomImage = imageList[randomIndex];

	return randomImage;
};

export default GetRandomImage;
