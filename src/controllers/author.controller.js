const mongoose = require("mongoose");
const { ClientError } = require("shokhijakhon-error-handler");
const AuthorModel = require("../models/Author.model");

module.exports = {
  async CREATE(req, res, next) {
    try {
      const { first_name, last_name, date_of_birth, date_of_death, country, bio } = req.body;

      if (!first_name || !last_name) {
        throw new ClientError("first_name and last_name required", 400);
      }

      const author = await AuthorModel.create({
        first_name,
        last_name,
        date_of_birth: date_of_birth || null,
        date_of_death: date_of_death || null,
        country: country || null,
        bio: bio || null,
      });

      return res.status(201).json({
        message: "Author successfully created",
        status: 201,
        data: author,
      });
    } catch (err) {
      next(err);
    }
  },

  async GET_ALL(req, res, next) {
    try {
      const { search } = req.query;

      const filter = {};
      if (search) {
        filter.$or = [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
        ];
      }

      const authors = await AuthorModel.find(filter).sort({ createdAt: -1 });
      return res.json({ status: 200, data: authors });
    } catch (err) {
      next(err);
    }
  },

  async GET_ONE(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid author id", 400);

      const author = await AuthorModel.findById(id);
      if (!author) throw new ClientError("Author not found", 404);

      return res.json({ status: 200, data: author });
    } catch (err) {
      next(err);
    }
  },

  async UPDATE(req, res, next) {
    try {
      const { id } = req.params;
      const { first_name, last_name, date_of_birth, date_of_death, country, bio } = req.body;
      
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid author id", 400);

      // Validate required fields if provided
      if (first_name !== undefined) {
        if (!first_name || String(first_name).trim().length === 0) {
          throw new ClientError("first_name cannot be empty", 400);
        }
        if (String(first_name).trim().length < 2) {
          throw new ClientError("first_name must be at least 2 characters", 400);
        }
        if (String(first_name).trim().length > 50) {
          throw new ClientError("first_name must be less than 50 characters", 400);
        }
      }

      if (last_name !== undefined) {
        if (!last_name || String(last_name).trim().length === 0) {
          throw new ClientError("last_name cannot be empty", 400);
        }
        if (String(last_name).trim().length < 2) {
          throw new ClientError("last_name must be at least 2 characters", 400);
        }
        if (String(last_name).trim().length > 50) {
          throw new ClientError("last_name must be less than 50 characters", 400);
        }
      }

      // Validate date formats if provided
      if (date_of_birth !== undefined && date_of_birth !== null) {
        const birthDate = new Date(date_of_birth);
        if (isNaN(birthDate.getTime())) {
          throw new ClientError("date_of_birth must be a valid date", 400);
        }
        if (birthDate > new Date()) {
          throw new ClientError("date_of_birth cannot be in the future", 400);
        }
      }

      if (date_of_death !== undefined && date_of_death !== null) {
        const deathDate = new Date(date_of_death);
        if (isNaN(deathDate.getTime())) {
          throw new ClientError("date_of_death must be a valid date", 400);
        }
        if (deathDate > new Date()) {
          throw new ClientError("date_of_death cannot be in the future", 400);
        }
        
        // If both dates are provided, death should be after birth
        if (date_of_birth !== undefined && date_of_birth !== null) {
          const birthDate = new Date(date_of_birth);
          if (deathDate < birthDate) {
            throw new ClientError("date_of_death cannot be before date_of_birth", 400);
          }
        }
      }

      // Validate country if provided
      if (country !== undefined && country !== null) {
        if (String(country).trim().length > 100) {
          throw new ClientError("country must be less than 100 characters", 400);
        }
      }

      // Validate bio if provided
      if (bio !== undefined && bio !== null) {
        if (String(bio).trim().length > 2000) {
          throw new ClientError("bio must be less than 2000 characters", 400);
        }
      }

      const updated = await AuthorModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updated) throw new ClientError("Author not found", 404);

      return res.json({
        message: "Author successfully updated",
        status: 200,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async DELETE(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid author id", 400);

      const deleted = await AuthorModel.findByIdAndDelete(id);
      if (!deleted) throw new ClientError("Author not found", 404);

      return res.json({ message: "Author successfully deleted", status: 200 });
    } catch (err) {
      next(err);
    }
  },

  async UPLOAD_PHOTO(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid author id", 400);

      if (!req.file) throw new ClientError("Photo is required", 400);

      const photo_url = `/uploads/authors/${req.file.filename}`;

      const updated = await AuthorModel.findByIdAndUpdate(id, { photo_url }, { new: true });
      if (!updated) throw new ClientError("Author not found", 404);

      return res.json({
        message: "Author photo uploaded",
        status: 200,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
