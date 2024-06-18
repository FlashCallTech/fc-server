'use client'
import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import { useParams } from 'next/navigation'
import { ChatTimerProvider } from '@/lib/context/ChatTimerContext'
import { useUser } from '@clerk/nextjs'
import { Timestamp } from 'firebase/firestore'
const page = () => {
	const { clientId, creatorId } = useParams();
	return (
		<div>
			<ChatTimerProvider
				clientId={clientId as string}
				creatorId={creatorId as string}
			>
				<ChatInterface />
			</ChatTimerProvider>
		</div>
	)
}

export default page
