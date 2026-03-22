import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Furniture",
        "Electronics",
        "Linens",
        "Bathroom",
        "Kitchen",
        "Cleaning",
        "Maintenance",
        "Amenities",
        "Safety",
        "Other"
      ],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    maxQuantity: {
      type: Number,
      default: 10,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: 0,
    },
    totalValue: {
      type: Number,
      default: 0
    },
    supplier: {
      name: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      contact: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      }
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock", "On Order", "Discontinued"],
      default: "In Stock"
    },
    condition: {
      type: String,
      enum: ["New", "Good", "Fair", "Poor", "Damaged", "Needs Replacement"],
      default: "Good",
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    warrantyExpiry: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'critical';
  if (this.quantity <= this.minQuantity) return 'low';
  if (this.quantity >= this.maxQuantity) return 'overstocked';
  return 'normal';
});

// Virtual for days since last restock
inventorySchema.virtual('daysSinceRestock').get(function() {
  if (!this.lastRestocked) return null;
  const diffTime = Math.abs(new Date() - this.lastRestocked);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status and total value
inventorySchema.pre("save", function() {
  // Update total value
  this.totalValue = this.quantity * this.unitPrice;
  
  // Update status based on quantity
  if (this.quantity === 0) {
    this.status = "Out of Stock";
  } else if (this.quantity <= this.minQuantity) {
    this.status = "Low Stock";
  } else if (this.status === "Out of Stock" || this.status === "Low Stock") {
    this.status = "In Stock";
  }
});

// Indexes for better query performance
inventorySchema.index({ roomId: 1, category: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ barcode: 1 });
inventorySchema.index({ nextMaintenanceDate: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;