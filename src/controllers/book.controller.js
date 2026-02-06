const mongoose = require("mongoose");
const { ClientError } = require("shokhijakhon-error-handler");
const BookModel = require("../models/Book.model");
const AuthorModel = require("../models/Author.model");
const CategoryModel = require("../models/Category.model");

module.exports = {
  // CREATE BOOK (admin)
  async CREATE(req, res, next) {
    try {
      const data = req.body;

      // required fields
      if (
        !data.title ||
        !data.description ||
        !data.author_id ||
        !data.category_id
      ) {
        throw new ClientError(
          "title, description, author_id, category_id required",
          400,
        );
      }

      if (data.year == null || data.year === "" || isNaN(Number(data.year))) {
        throw new ClientError("year is required and must be a number", 400);
      }
      const yearNum = Number(data.year);
      if (yearNum < 0 || yearNum > 3000) {
        throw new ClientError("year must be between 0 and 3000", 400);
      }

      if (data.pages == null || data.pages === "" || isNaN(Number(data.pages))) {
        throw new ClientError("pages is required and must be a number", 400);
      }
      const pagesNum = Number(data.pages);
      if (pagesNum < 1) {
        throw new ClientError("pages must be at least 1", 400);
      }

      // description length (senda modelda minlength=10 bo'lgan)
      if (String(data.description).trim().length < 10) {
        throw new ClientError(
          "description must be at least 10 characters",
          400,
        );
      }

      // author_id validate
      if (!mongoose.isValidObjectId(data.author_id)) {
        throw new ClientError("Invalid author_id !", 400);
      }

      const author = await AuthorModel.findById(data.author_id);
      if (!author) throw new ClientError("Author not found !", 404);

      // category_id validate
      if (!mongoose.isValidObjectId(data.category_id)) {
        throw new ClientError("Invalid category_id !", 400);
      }

      const category = await CategoryModel.findById(data.category_id);
      if (!category) throw new ClientError("Category not found !", 404);

      data.created_by = req.user_id;
      data.year = yearNum;
      data.pages = pagesNum;

      // create
      const book = await BookModel.create(data);

      return res.status(201).json({
        message: "Book successfully created",
        status: 201,
        data: book,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET ALL BOOKS + SEARCH + PAGINATION
  async GET_ALL(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category_id,
        author_id,
      } = req.query;

      const filter = {};

      if (search) {
        filter.$text = { $search: search };
      }

      if (category_id) filter.category_id = category_id;
      if (author_id) filter.author_id = author_id;

      const books = await BookModel.find(filter)
        .populate("author_id", "first_name last_name")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await BookModel.countDocuments(filter);

      return res.json({
        status: 200,
        total,
        page: Number(page),
        limit: Number(limit),
        data: books,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET ONE BOOK
  async GET_ONE(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        throw new ClientError("Invalid book id", 400);
      }

      const book = await BookModel.findById(id)
        .populate("author_id", "first_name last_name")
        .populate("category_id", "name")
        .populate("created_by", "first_name last_name email");

      if (!book) throw new ClientError("Book not found", 404);

      // view count
      await BookModel.findByIdAndUpdate(id, {
        $inc: { "stats.views": 1 },
      });

      return res.json({ status: 200, data: book });
    } catch (err) {
      next(err);
    }
  },

  // UPDATE BOOK
  async UPDATE(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!mongoose.isValidObjectId(id)) {
        throw new ClientError("Invalid book id", 400);
      }

      // Validate title if provided
      if (data.title !== undefined) {
        if (!data.title || String(data.title).trim().length === 0) {
          throw new ClientError("title cannot be empty", 400);
        }
        if (String(data.title).trim().length < 2) {
          throw new ClientError("title must be at least 2 characters", 400);
        }
        if (String(data.title).trim().length > 200) {
          throw new ClientError("title must be less than 200 characters", 400);
        }
      }

      // Validate description if provided
      if (data.description !== undefined) {
        if (!data.description || String(data.description).trim().length === 0) {
          throw new ClientError("description cannot be empty", 400);
        }
        if (String(data.description).trim().length < 10) {
          throw new ClientError("description must be at least 10 characters", 400);
        }
        if (String(data.description).trim().length > 5000) {
          throw new ClientError("description must be less than 5000 characters", 400);
        }
      }

      // Validate year if provided
      if (data.year !== undefined) {
        if (data.year == null || data.year === "" || isNaN(Number(data.year))) {
          throw new ClientError("year must be a valid number", 400);
        }
        const yearNum = Number(data.year);
        if (yearNum < 0 || yearNum > 3000) {
          throw new ClientError("year must be between 0 and 3000", 400);
        }
        data.year = yearNum;
      }

      // Validate pages if provided
      if (data.pages !== undefined) {
        if (data.pages == null || data.pages === "" || isNaN(Number(data.pages))) {
          throw new ClientError("pages must be a valid number", 400);
        }
        const pagesNum = Number(data.pages);
        if (pagesNum < 1) {
          throw new ClientError("pages must be at least 1", 400);
        }
        if (pagesNum > 10000) {
          throw new ClientError("pages must be less than 10000", 400);
        }
        data.pages = pagesNum;
      }

      // Validate author_id if provided
      if (data.author_id !== undefined) {
        if (!data.author_id) {
          throw new ClientError("author_id cannot be empty", 400);
        }
        if (!mongoose.isValidObjectId(data.author_id)) {
          throw new ClientError("Invalid author_id", 400);
        }

        const author = await AuthorModel.findById(data.author_id);
        if (!author) throw new ClientError("Author not found", 404);
      }

      // Validate category_id if provided
      if (data.category_id !== undefined) {
        if (!data.category_id) {
          throw new ClientError("category_id cannot be empty", 400);
        }
        if (!mongoose.isValidObjectId(data.category_id)) {
          throw new ClientError("Invalid category_id", 400);
        }

        const category = await CategoryModel.findById(data.category_id);
        if (!category) throw new ClientError("Category not found", 404);
      }

      // Validate ISBN if provided
      if (data.isbn !== undefined && data.isbn !== null) {
        const isbnStr = String(data.isbn).trim();
        if (isbnStr.length > 0) {
          // Basic ISBN format validation (10 or 13 digits)
          const isbnRegex = /^(?:\d{10}|\d{13})$/;
          if (!isbnRegex.test(isbnStr.replace(/[-\s]/g, ''))) {
            throw new ClientError("ISBN must be 10 or 13 digits", 400);
          }
          data.isbn = isbnStr;
        }
      }

      // Validate language if provided
      if (data.language !== undefined && data.language !== null) {
        if (String(data.language).trim().length > 50) {
          throw new ClientError("language must be less than 50 characters", 400);
        }
      }

      // Validate publisher if provided
      if (data.publisher !== undefined && data.publisher !== null) {
        if (String(data.publisher).trim().length > 100) {
          throw new ClientError("publisher must be less than 100 characters", 400);
        }
      }

      const updated = await BookModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!updated) throw new ClientError("Book not found", 404);

      return res.json({
        message: "Book successfully updated",
        status: 200,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE BOOK
  async DELETE(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        throw new ClientError("Invalid book id", 400);
      }

      const deleted = await BookModel.findByIdAndDelete(id);
      if (!deleted) throw new ClientError("Book not found", 404);

      return res.json({
        message: "Book successfully deleted",
        status: 200,
      });
    } catch (err) {
      next(err);
    }
  },

  async UPLOAD_COVER(req, res, next) {
    try {
      const { ClientError } = require("shokhijakhon-error-handler");
      const mongoose = require("mongoose");
      const BookModel = require("../models/Book.model");

      const { id } = req.params;
      if (!mongoose.isValidObjectId(id))
        throw new ClientError("Invalid book id", 400);

      if (!req.file) throw new ClientError("Cover is required", 400);

      const cover_url = `/uploads/books/${req.file.filename}`;

      const updated = await BookModel.findByIdAndUpdate(
        id,
        { cover_url },
        { new: true },
      );
      if (!updated) throw new ClientError("Book not found", 404);

      return res.json({
        message: "Book cover uploaded",
        status: 200,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
