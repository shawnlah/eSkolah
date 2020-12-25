import { model, Schema } from "mongoose";
import { InventoryModelInterface } from "../interfaces/inventory";

const InventorySchema: Schema = new Schema(
  {
    description: {
      type: String
    },
    history: [
      {
        borrowedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        borrowedOn: {
          type: Date,
          required: true
        },
        returnedOn: {
          type: Date
        }
      }
    ],
    inventoryType: {
      type: String,
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    location: {
      type: String
    },
    lastBorrowedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    lastBorrowedDate: {
      type: Date
    },
    name: {
      type: String,
      required: true
    },
    purchasedOn: {
      type: Date
    },
    purchasePrice: {
      type: String
    },
    purchaseAt: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

export default model<InventoryModelInterface>('Inventory', InventorySchema)