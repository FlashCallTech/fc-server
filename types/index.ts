// User Params

export type CreateUserParams = {
	clerkId: string;
	firstName: string;
	lastName: string;
	username: string;
	photo: string;
	phone: any;
	role: string;
	bio?: string;
};

export type UpdateUserParams = {
	id?: string;
	fullName?: string;
	firstName: string;
	lastName: string;
	username: string;
	phone?: string;
	photo: string;
	bio?: string;
	role?: string;
};

// Creator Params

export type creatorUser = {
	_id: string;
	firstName: string;
	lastName: string;
	username: string;
	photo: string;
	phone: string;
	profession: string;
	themeSelected: string;
	gender: string;
	dob: string;
	bio: string;
	videoRate: string;
	audioRate: string;
	chatRate: string;
	kyc_status: string;
};

export type CreateCreatorParams = {
	_id?: string;
	firstName?: string;
	lastName?: string;
	username: string;
	photo: string;
	phone: any;
	profession: string;
	themeSelected: string;
	gender?: string;
	dob?: string;
	bio?: string;
	kyc_status: string;
};

export type UpdateCreatorParams = {
	_id?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	username?: string;
	phone?: string;
	photo: string;
	role?: string;
	profession?: string;
	themeSelected?: string;
	videoRate?: string;
	audioRate?: string;
	chatRate?: string;
	gender?: string;
	dob?: string;
	bio?: string;
	kyc_status: string;
};

// Feedback Params

export type CreateFeedbackParams = {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	callId: string;
	createdAt: Date;
};

// Call Params

export type RegisterCallParams = {
	callId: string;
	type: string;
	members: {
		clientId: string;
		creatorId: string;
	}[];
	startedAt: Date;
	endedAt?: Date;
};

export type UpdateCallParams = {
	callId?: string;
	type?: string;
	members?: {
		clientId: string;
		creatorId: string;
	}[];
	startedAt?: Date;
	endedAt?: Date;
};

// app/razorpay.d.ts

export interface RazorpayOptions {
	key: string;
	amount: number;
	currency: string;
	name: string;
	description: string;
	image: string;
	order_id: string;
	handler: (response: PaymentResponse) => void;
	prefill: {
		name: string;
		email: string;
		contact: string;
		method: string;
	};
	notes: {
		address: string;
	};
	theme: {
		color: string;
	};
}

export interface PaymentResponse {
	razorpay_payment_id: string;
	razorpay_order_id: string;
	razorpay_signature: string;
}

export interface PaymentFailedResponse {
	error: {
		code: string;
		description: string;
		source: string;
		step: string;
		reason: string;
		metadata: {
			order_id: string;
			payment_id: string;
		};
		data?: {
			poa_front_dob?: string | null;
			poi_imagePath?: string;
			face_imagePath?: string;
			digilocker_address?: string | null;
			poa_backImagePath?: string;
			poa_front_name?: string;
			poi_name?: string;
			poa_back_name?: string | null;
			poa_front_idNumber?: string;
			poa_back_idNumber?: string;
			poa_back_dob?: string;
			digilocker_idPhoto?: string | null;
			poi_dob?: string;
			poa_frontImagePath?: string;
			digilocker_dob?: string | null;
		};
	};
}

// User Kyc Params

export type RegisterUserKycParams = {
	transactionId: string;
	status: "auto_approved" | "auto_declined" | "needs_review";
	data?: {
		poa_front_dob: string | null;
		poi_imagePath: string;
		face_imagePath: string;
		digilocker_address: string | null;
		poa_backImagePath: string;
		poa_front_name: string;
		poi_name: string;
		poa_back_name: string | null;
		poa_front_idNumber: string;
		poa_back_idNumber: string;
		poa_back_dob: string;
		digilocker_idPhoto: string | null;
		poi_dob: string;
		poa_frontImagePath: string;
		digilocker_dob: string | null;
	};
};

export type UpdateUserKycParams = {
	status?: "auto_approved" | "auto_declined" | "needs_review";
	data?: {
		poa_front_dob?: string | null;
		poi_imagePath?: string;
		face_imagePath?: string;
		digilocker_address?: string | null;
		poa_backImagePath?: string;
		poa_front_name?: string;
		poi_name?: string;
		poa_back_name?: string | null;
		poa_front_idNumber?: string;
		poa_back_idNumber?: string;
		poa_back_dob?: string;
		digilocker_idPhoto?: string | null;
		poi_dob?: string;
		poa_frontImagePath?: string;
		digilocker_dob?: string | null;
	};
};

// Wallet Params

export type WalletParams = {
	userId: string;
	userType: string;
	amount: number;
};
