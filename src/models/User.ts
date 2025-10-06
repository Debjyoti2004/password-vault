import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);