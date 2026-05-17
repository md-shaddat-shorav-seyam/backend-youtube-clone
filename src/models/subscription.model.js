import mongoose,{ Schema } from "mongoose";

const subscrptionSchema = new Schema
(
    {
        subsriber:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
             type:Schema.Types.ObjectId,
            ref:"User"
        }
    
    },
    {timestamps:true}
)

export const Subscription = mongoose.model("Subscription",subscrptionSchema)