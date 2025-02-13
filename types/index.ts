import { Types } from "mongoose";

// Gender
export type Gender = "male" | "female" | "other" | undefined;

// User Params

export type CreateUserParams = {
	firstName: string;
	lastName: string;
	username: string;
	photo: string;
	phone: any;
	role: string;
	bio?: string;
};

export type CreateForeignUserParams = {
	username: string;
	email: string;
	fullName?: string;
	phone?: string;
	photo: string;
	role: string;
	bio?: string;
	walletBalance: number;
	global: boolean;
	fcmToken: string;
};

export type UpdateUserParams = {
	id?: string;
	fullName?: string;
	firstName: string;
	lastName: string;
	username: string;
	profession?: string;
	themeSelected?: string;
	phone?: string;
	photo?: string;
	bio?: string;
	role?: string;
	gender?: string;
	dob?: string;
	creatorId?: string;
	referralId?: string;
	referredBy?: string;
	referralAmount?: number;
	restricted?: boolean;
	blocked?: any[];
};

export type clientUser = {
	_id: string;
	fullName: string;
	firstName: string;
	lastName: string;
	username: string;
	photo: string;
	phone?: string;
	email?: string;
	walletBalance: number;
	bio: string;
	gender?: string;
	dob?: string;
	creatorId?: string;
	profession?: string;
	themeSelected?: string;
	createdAt?: string;
	referralId?: string;
	referredBy?: string;
	referralAmount?: number;
	restricted?: boolean;
	blocked?: any[];
	global?: boolean;
	accessToken?: string;
};

// Creator Params

export type creatorUser = {
	_id: string;
	fullName?: string;
	firstName: string;
	lastName: string;
	username: string;
	photo: string;
	phone?: string;
	email?: string;
	profession: string;
	themeSelected: string;
	gender: string;
	dob: string;
	bio: string;
	videoRate: string;
	audioRate: string;
	chatRate: string;
	globalVideoRate: string;
	globalAudioRate: string;
	globalChatRate: string;
	videoAllowed: boolean;
	audioAllowed: boolean;
	chatAllowed: boolean;
	kycStatus: string;
	walletBalance: number;
	referralId: string;
	referredBy: string;
	referralAmount: number;
	creatorId?: string;
	links?: LinkType[];
	updatedAt?: string;
	createdAt?: string;
	restricted?: boolean;
	blocked?: any[];
	global?: boolean;
	commission?: number;
	accessToken?: string;
};

export type CreateCreatorParams = {
	_id?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	username: string;
	photo: string;
	phone: any;
	profession?: string;
	themeSelected?: string;
	videoRate?: string;
	audioRate?: string;
	chatRate?: string;
	gender?: string;
	dob?: string;
	bio?: string;
	kyc_status?: string;
	walletBalance: number;
	referralId?: string;
	referredBy?: string | null;
	referralAmount?: number;
	creatorId?: string;
	restricted?: boolean;
	blocked?: any[];
};

export type UpdateCreatorParams = {
	_id?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	username?: string;
	phone?: string;
	photo?: string;
	role?: string;
	profession?: string;
	themeSelected?: string;
	videoRate?: string;
	audioRate?: string;
	chatRate?: string;
	videoAllowed?: boolean;
	audioAllowed?: boolean;
	chatAllowed?: boolean;
	gender?: string;
	dob?: string;
	bio?: string;
	kycStatus?: string;
	paymentSettingsStatus?: string;
	walletBalance?: number;
	referralId?: string;
	referredBy?: string;
	referralAmount?: number;
	creatorId?: string;
	link?: LinkType;
	restricted?: boolean;
	blocked?: any[];
};

// Feedback Params
export type CreateFeedbackParams = {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	callId: string;
	createdAt: Date;
	position?: number;
};

export type CreatorFeedbackParams = {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	createdAt: Date;
	showFeedback: boolean;
	position?: number;
};

export type Client = {
	_id: string;
	username: string;
	phone: string;
	photo?: string;
	role?: string;
};

export type CreatorFeedback = {
	clientId: Client;
	rating: number;
	feedback: string;
	showFeedback: boolean;
	createdAt: Date;
	position?: number;
};

export type UserFeedback = {
	clientId: Client;
	rating: number;
	feedback: string;
	createdAt: Date;
	showFeedback?: boolean;
	position?: number;
};

// Call Params

export type MemberRequest = {
	user_id: string;
	custom: {
		name: string;
		type: string;
		image: string;
		phone?: string;
	};
	role: string;
};

export type LinkType = {
	title: string;
	url: string;
	isActive: Boolean;
};

export type RegisterCallParams = {
	callId: string;
	title?: string;
	type: string;
	status: string;
	creator: string;
	expertDetails?: any;
	members: MemberRequest[];
	startedAt?: Date;
	endedAt?: Date;
	duration?: string;
	feedbacks?: CreatorFeedback[];
	creatorDetails?: creatorUser;
	amount?: number;
	global?: boolean;
	amountINR?: number;
	category?: string;
};

export type ScheduledCallParams = {
	_id: string;
	callId: string;
	chatId?: string;
	type: "video" | "audio" | "chat";
	status: string;
	meetingOwner: clientUser;
	expert: creatorUser;
	description: string;
	selectedDay: string;
	selectedSlot: string;
	startsAt: Date;
	startedAt?: Date;
	endedAt?: Date;
	duration: number;
	amount: number;
	currency: string;
	discounts: AvailabilityService;
};

export type RegisterChatParams = {
	chatId: string;
	creator: string;
	status: string;
	members: MemberRequest[];
	startedAt?: Date;
	endedAt?: Date;
	duration?: number;
};

export interface UpdateChatParams {
	chatId: string;
	status: string;
	startedAt?: Date;
	endedAt?: Date;
	duration?: number;
}

export interface ChatDetails {
	price: number;
	status: string;
	startedAt: Date;
	endedAt?: Date;
	duration?: number;
}

export interface SelectedChat {
	chatId: string;
	creator: string;
	status: string;
	members: MemberRequest[];
	chatDetails: ChatDetails[];
	startedAt?: Date;
	endedAt?: Date;
	duration?: number;
	price?: number;
}

export type UpdateCallParams = {
	callId?: string;
	type?: string;
	status?: string;
	members?: MemberRequest[];
	startedAt?: Date;
	endedAt?: Date;
	duration?: string;
};

// app/razorpay.d.ts

export interface RazorpayOptions {
	key: string;
	rechargeAmount: number;
	currency: string;
	name: string;
	description: string;
	image: string;
	order_id: string;
	handler: (response: PaymentResponse) => Promise<void>;
	prefill: {
		name?: string;
		email?: string;
		contact: string;
		method?: string;
	};
	notes?: {
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
			poa_front_dob?: string;
			poi_imagePath?: string;
			face_imagePath?: string;
			digilocker_address?: string;
			poa_backImagePath?: string;
			poa_front_name?: string;
			poi_name?: string;
			poa_back_name?: string;
			poa_front_idNumber?: string;
			poa_back_idNumber?: string;
			poa_back_dob?: string;
			digilocker_idPhoto?: string;
			poi_dob?: string;
			poa_frontImagePath?: string;
			digilocker_dob?: string;
		};
	};
}

// User Kyc Params

export type RegisterUserKycParams = {
	transactionId: string;
	status: "auto_approved" | "auto_declined" | "needs_review";
	data?: {
		poa_front_dob: string;
		poi_imagePath: string;
		face_imagePath: string;
		digilocker_address: string;
		poa_backImagePath: string;
		poa_front_name: string;
		poi_name: string;
		poa_back_name: string;
		poa_front_idNumber: string;
		poa_back_idNumber: string;
		poa_back_dob: string;
		digilocker_idPhoto: string;
		poi_dob: string;
		poa_frontImagePath: string;
		digilocker_dob: string;
	};
};

export type UpdateUserKycParams = {
	status?: "auto_approved" | "auto_declined" | "needs_review";
	data?: {
		poa_front_dob?: string;
		poi_imagePath?: string;
		face_imagePath?: string;
		digilocker_address?: string;
		poa_backImagePath?: string;
		poa_front_name?: string;
		poi_name?: string;
		poa_back_name?: string;
		poa_front_idNumber?: string;
		poa_back_idNumber?: string;
		poa_back_dob?: string;
		digilocker_idPhoto?: string;
		poi_dob?: string;
		poa_frontImagePath?: string;
		digilocker_dob?: string;
	};
};

// Wallet Params

export type WalletParams = {
	userId: string;
	userType: string;
	amount: number;
	method?: string;
	flag?: any;
	category?: string;
	callType?: string;
};

// Call Transactions
export interface RegisterCallTransactionParams {
	callId: string;
	// callDetails
	amountPaid: number;
	isDone?: boolean;
	callDuration: number;
}

export interface UpdateCallTransactionParams {
	callId: string;
	amountPaid?: number;
	isDone?: boolean;
	callDuration?: number;
}

// Discount Service Type

export interface DiscountRule {
	_id: string;
	conditions: [
		"New User" | "Seasonal Offer" | "30 Minutes Call" | "60 Minutes Call"
	];
	discountAmount: number;
	discountType: "percentage" | "flat";
}

export interface Service {
	_id: string;
	creatorId: string;
	title: string;
	description: string;
	photo: string;
	type: string[];
	isActive: boolean;
	currency: "INR" | "USD";
	discountRules: DiscountRule[];
	extraDetails?: string;
	createdAt: string;
	updatedAt: string;
	utilizedBy: Types.ObjectId[];
	typeLabel?: string;
}

// Availability Service Type

export interface AvailabilityService {
	_id: string;
	creatorId: string;
	title: string;
	description: string;
	photo: string;
	type: "audio" | "video" | "chat";
	timeDuration: number;
	basePrice: number;
	isActive: boolean;
	currency: "INR" | "USD";
	discountRules: {
		_id: string;
		conditions: ["30 Minutes Call" | "60 Minutes Call"];
		discountAmount: number;
		discountType: "percentage" | "flat";
	};
	extraDetails?: string;
	createdAt: string;
	updatedAt: string;
	utilizedBy: Types.ObjectId[];
}

export interface Chat {
	callId: string;
	chatId: string;
	chatRate: string;
	clientId: string;
	clientImg: string;
	clientName: string;
	clientPhone?: string;
	creatorId: string;
	creatorImg: string;
	creatorName: string;
	creatorPhone: string;
	endedAt?: number;
	messages: {
		senderId: string;
		text: string;
		createdAt: number;
		img: string;
		audio: string;
		seen: boolean;
		tip: string;
	}[];
	startedAt: number;
	status: string;
	timerSet: boolean;
}
