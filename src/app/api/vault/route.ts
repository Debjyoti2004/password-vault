import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import VaultItemModel from '@/models/VaultItem';
import UserModel from '@/models/User';


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  try {
    const vaultItems = await VaultItemModel.find({ userId: user._id });
    return Response.json({ success: true, data: vaultItems }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Error fetching vault items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return Response.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  try {
    const { encryptedData } = await request.json();
    if (!encryptedData) {
      return Response.json({ success: false, message: 'Encrypted data is required' }, { status: 400 });
    }

    const newVaultItem = new VaultItemModel({
      userId: user._id,
      encryptedData,
    });

    await newVaultItem.save();
    return Response.json({ success: true, data: newVaultItem }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, message: 'Error creating vault item' }, { status: 500 });
  }
}