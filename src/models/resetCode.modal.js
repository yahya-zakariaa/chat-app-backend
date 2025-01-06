import mongoose from "mongoose";

const resetCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: String,
  expireAt: Date,
});

resetCodeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
const ResetCode = mongoose.model("ResetCode", resetCodeSchema);
export default ResetCode;
