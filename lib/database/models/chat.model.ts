import { Schema, model, models } from "mongoose";

const ChatDetailsSchema = new Schema({
	startedAt: { type: Date },
	status: {type: String},
	endedAt: { type: Date },
    duration: {type: String}
}, { _id: false });

const ChatSchema = new Schema({
	chatId: { type: String, required: true },
	creator:{ type: String, required: true },
	startedAt: { type: Date, requried: true },
	endedAt:{type: Date },
	members: [
		{
			user_id: { type: String, required: true },
			custom: {
				name: { type: String},
				type: { type: String},
				image: { type: String},
			},
			role: { type: String, required: true },
		},
	],
	chatDetails: [ChatDetailsSchema],
});

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;
