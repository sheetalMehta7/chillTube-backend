import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //list of subscribers
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User" // user to which subscriber has subscribed
    },
}, {timestamps: true});


export const SubscriptionSchema = mongoose.model("Subscription", subscriptionSchema);