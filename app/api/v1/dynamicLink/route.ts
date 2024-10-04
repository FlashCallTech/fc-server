import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { referralCode } = await request.json();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_KEY;

  if(!referralCode) {
    return NextResponse.json({success: false, message: 'Referral code is required'});
  }

  const dynamicLinkParams = {
    dynamicLinkInfo: {
      domainUriPrefix: 'https://flashcallrefer.page.link',  // Your Firebase Dynamic Links domain
      link: `https://flashcall.me/authenticate?userType=creator&refId=${referralCode}`,  // Your link with referral code
      androidInfo: {
        androidPackageName: 'your.app.id',
        androidFallbackLink: `https://play.google.com/store/apps/details?id=your.app.id&referrer=${referralCode}`,  // Android Play Store link with referral
      },
      iosInfo: {
        iosBundleId: 'com.your.app',
        iosFallbackLink: `https://flashcall.me/authenticate?userType=creator&refId=${referralCode}`,  // iOS fallback
      },
    },
    suffix: {
      option: 'SHORT',  // Request a short link
    },
  };

  const url = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dynamicLinkParams),  // Convert to JSON
    });

    if (!response.ok) {
      throw new Error('Failed to create dynamic link');
    }

    const data = await response.json();  // Parse JSON response
    return NextResponse.json({success: true, data: data});
  } catch (error) {
    return NextResponse.json({success: false, message: error});
  }
}