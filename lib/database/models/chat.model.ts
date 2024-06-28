import mongoose, { Schema, model, models } from "mongoose";

const ChatDetailsSchema = new Schema({
	members: [
		{
			clientId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Client",
				required: true,
			},
			creatorId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Creator",
				required: true,
			},
		},
	],
	startedAt: { type: Date, default: Date.now },
	endedAt: { type: Date },
    duration: {type: String}
}, { _id: false });

const ChatSchema = new Schema({
	chatId: { type: String, required: true, unique: true },
	chatDetails: [ChatDetailsSchema], // New field to store the details array
});

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;
