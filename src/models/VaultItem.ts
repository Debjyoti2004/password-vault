import mongoose, { Schema, Document } from 'mongoose';

export interface IVaultItem extends Document {
  userId: Schema.Types.ObjectId;
  encryptedData: string;
}

const VaultItemSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  encryptedData: {
    type: String,
    required: true,
  },
});

export default mongoose.models.VaultItem || mongoose.model<IVaultItem>('VaultItem', VaultItemSchema);