const GetRandomImage = () => {
	// random profile image
	let imageList = [
		"https://dxvnlnyzij172.cloudfront.net/users/1.png",
		"https://dxvnlnyzij172.cloudfront.net/users/2.png",
		"https://dxvnlnyzij172.cloudfront.net/users/3.png",
		"https://dxvnlnyzij172.cloudfront.net/users/4.png",
		"https://dxvnlnyzij172.cloudfront.net/users/5.png",
		"https://dxvnlnyzij172.cloudfront.net/users/6.png",
	];
	// Check if we are in the browser
	if (typeof window !== "undefined") {
		const storedImage = sessionStorage.getItem("randomImage");

		if (storedImage) {
			// If available, return the stored image
			return storedImage;
		} else {
			// Otherwise, select a random image
			const randomIndex = Math.floor(Math.random() * imageList.length);
			const randomImage = imageList[randomIndex];

			// Store the selected random image in session storage
			sessionStorage.setItem("randomImage", randomImage);

			// Return the selected random image
			return randomImage;
		}
	}

	// Fallback in case sessionStorage is not available
	return imageList[0]; // or any default image
};

export default GetRandomImage;
