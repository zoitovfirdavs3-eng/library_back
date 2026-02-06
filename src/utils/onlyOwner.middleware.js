const mongoose = require("mongoose");
const { ClientError } = require("shokhijakhon-error-handler");
const BookModel = require("../models/Book.model");

module.exports = async function onlyOwner(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new ClientError("Invalid book id", 400);
    }

    const book = await BookModel.findById(id).select("created_by");
    if (!book) throw new ClientError("Book not found", 404);

    if (String(book.created_by) !== String(req.user_id)) {
      throw new ClientError("You can only edit/delete your own book", 403);
    }

    next();
  } catch (err) {
    next(err);
  }
};
