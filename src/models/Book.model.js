const { Schema, model } = require("mongoose");

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    description: {
      type: String,
      required: [true, "Book description is required"],
      trim: true,
      minlength: 10,
    },

    author_id: {
      type: Schema.Types.ObjectId,
      ref: "authors",
      required: [true, "author_id is required"],
    },

    category_id: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: [true, "category_id is required"],
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    year: { type: Number, required: [true, "year is required"], min: 0, max: 3000 },
    pages: { type: Number, required: [true, "pages is required"], min: 1 },

    country: { type: String, trim: true, default: null },
    lang: { type: String, trim: true, default: "uz" },

    price: { type: Number, default: 0, min: 0 },

    cover_url: { type: String, default: null },
    pdf_url: { type: String, default: null },
    audio_url: { type: String, default: null },

    stats: {
      views: { type: Number, default: 0, min: 0 },
      likes: { type: Number, default: 0, min: 0 },
      rating_avg: { type: Number, default: 0, min: 0, max: 5 },
      rating_count: { type: Number, default: 0, min: 0 },
    },

    is_published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

bookSchema.index({ title: "text", description: "text" });

module.exports = model("books", bookSchema);
