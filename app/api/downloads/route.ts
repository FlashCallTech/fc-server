import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	const s3Url =
		"https://s3.eu-north-1.amazonaws.com/flashcall.me/downloads/official.apk";

	// Redirect the user to the S3 URL
	res.redirect(302, s3Url);
}
