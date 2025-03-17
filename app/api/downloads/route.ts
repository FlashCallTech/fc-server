import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	const s3Url = "https://dxvnlnyzij172.cloudfront.net/downloads/official.apk";

	// Redirect the user to the S3 URL
	res.redirect(302, s3Url);
}
