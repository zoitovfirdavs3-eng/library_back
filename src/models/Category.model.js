const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    cover_url: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("categories", categorySchema);
