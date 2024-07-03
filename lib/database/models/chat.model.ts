import mongoose, { Schema, model, models } from "mongoose";

const ChatDetailsSchema = new Schema({
	startedAt: { type: Number },
	status: {type: String},
	endedAt: { type: Number },
    duration: {type: String}
}, { _id: false });

const ChatSchema = new Schema({
	chatId: { type: String, required: true, unique: true },
	members: [
		{
			user_id: { type: String, required: true },
			custom: {
				name: { type: String, required: true },
				type: { type: String, required: true },
				image: { type: String, required: true },
			},
			role: { type: String, required: true },
		},
	],
	chatDetails: [ChatDetailsSchema],
});

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;
