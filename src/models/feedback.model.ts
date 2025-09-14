import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}


const FeedbackSchema = new Schema<IFeedback>({
  name: { type: String, required: true, minlength: 3, trim: true },
  email: { type: String, required: true, match: /.+\@.+\..+/, lowercase: true },
  message: { type: String, required: true, minlength: 10 },
}, {
  timestamps: true // keep both createdAt and updatedAt for audit, but only return createdAt in API if needed
});

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
