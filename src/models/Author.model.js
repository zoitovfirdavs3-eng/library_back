const { Schema, model } = require("mongoose");

const authorSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    date_of_birth: { type: Date, default: null },
    date_of_death: { type: Date, default: null },

    country: { type: String, trim: true, default: null },
    bio: { type: String, trim: true, default: null },

    photo_url: { type: String, default: null }, // /uploads/authors/...
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

module.exports = model("authors", authorSchema);
