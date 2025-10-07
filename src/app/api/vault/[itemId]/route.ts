import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import VaultItemModel from "@/models/VaultItem";
import UserModel from "@/models/User";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  await dbConnect();
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return Response.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  try {
    const { itemId } = await params;
    const { encryptedData } = await request.json();

    if (!encryptedData) {
      return Response.json(
        { success: false, message: "Encrypted data is required" },
        { status: 400 }
      );
    }

    const updatedItem = await VaultItemModel.findOneAndUpdate(
      { _id: itemId, userId: user._id },
      { encryptedData },
      { new: true }
    );

    if (!updatedItem) {
      return Response.json(
        {
          success: false,
          message: "Item not found or you do not have permission",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        data: updatedItem,
        message: "Item updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating item:", error);
    return Response.json(
      { success: false, message: "Error updating item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  await dbConnect();
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return Response.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  try {
    const { itemId } = await params;
    const result = await VaultItemModel.findOneAndDelete({
      _id: itemId,
      userId: user._id,
    });

    if (!result) {
      return Response.json(
        {
          success: false,
          message: "Item not found or you do not have permission",
        },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return Response.json(
      { success: false, message: "Error deleting item" },
      { status: 500 }
    );
  }
}
