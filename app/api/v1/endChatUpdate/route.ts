import { db } from "@/lib/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {data} = await request.json();
    const chatsRef = collection(db, "chats");
    await updateDoc(doc(chatsRef, data as string), {
      status: "ended",
    })
    return NextResponse.json("ended");
  } catch (error) {
    return NextResponse.json(error);
  }
}