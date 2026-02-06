const { ClientError } = require("shokhijakhon-error-handler");
const mongoose = require("mongoose");
const CategoryModel = require("../models/Category.model");

function makeSlug(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

module.exports = {
  async CREATE(req, res, next) {
    try {
      let { name, slug, description } = req.body;

      if (!name) throw new ClientError("name is required", 400);

      slug = slug ? makeSlug(slug) : makeSlug(name);
      if (!slug) throw new ClientError("slug is required", 400);

      const exists = await CategoryModel.findOne({ $or: [{ name }, { slug }] });
      if (exists) throw new ClientError("Category already exists", 409);

      const category = await CategoryModel.create({ name, slug, description: description || null });

      return res.status(201).json({
        message: "Category successfully created",
        status: 201,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },

  async GET_ALL(req, res, next) {
    try {
      const categories = await CategoryModel.find().sort({ createdAt: -1 });
      return res.json({ status: 200, data: categories });
    } catch (err) {
      next(err);
    }
  },

  async GET_ONE(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid category id", 400);

      const category = await CategoryModel.findById(id);
      if (!category) throw new ClientError("Category not found", 404);

      return res.json({ status: 200, data: category });
    } catch (err) {
      next(err);
    }
  },

  async UPDATE(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, description } = req.body;
      
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid category id", 400);

      // Validate name if provided
      if (name !== undefined) {
        if (!name || String(name).trim().length === 0) {
          throw new ClientError("name cannot be empty", 400);
        }
        if (String(name).trim().length < 2) {
          throw new ClientError("name must be at least 2 characters", 400);
        }
        if (String(name).trim().length > 100) {
          throw new ClientError("name must be less than 100 characters", 400);
        }
      }

      // Validate and generate slug if provided
      let finalSlug = slug;
      if (slug !== undefined) {
        if (!slug || String(slug).trim().length === 0) {
          throw new ClientError("slug cannot be empty", 400);
        }
        finalSlug = makeSlug(slug);
        if (!finalSlug) {
          throw new ClientError("slug format is invalid", 400);
        }
      } else if (name !== undefined) {
        // Generate slug from name if name is updated but slug is not provided
        finalSlug = makeSlug(name);
      }

      // Validate description if provided
      if (description !== undefined && description !== null) {
        if (String(description).trim().length > 1000) {
          throw new ClientError("description must be less than 1000 characters", 400);
        }
      }

      // Check for uniqueness if name or slug is being updated
      if (name !== undefined || slug !== undefined) {
        const currentCategory = await CategoryModel.findById(id);
        if (!currentCategory) throw new ClientError("Category not found", 404);

        const filter = { _id: { $ne: id } };
        const orConditions = [];
        
        if (name !== undefined && name !== currentCategory.name) {
          orConditions.push({ name });
        }
        
        if (finalSlug !== undefined && finalSlug !== currentCategory.slug) {
          orConditions.push({ slug: finalSlug });
        }

        if (orConditions.length > 0) {
          filter.$or = orConditions;
          const exists = await CategoryModel.findOne(filter);
          if (exists) {
            if (name !== undefined && name === exists.name) {
              throw new ClientError("Category with this name already exists", 409);
            }
            if (finalSlug !== undefined && finalSlug === exists.slug) {
              throw new ClientError("Category with this slug already exists", 409);
            }
          }
        }
      }

      // Prepare update data
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (finalSlug !== undefined) updateData.slug = finalSlug;
      if (description !== undefined) updateData.description = description;

      const updated = await CategoryModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updated) throw new ClientError("Category not found", 404);

      return res.json({
        message: "Category successfully updated",
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
      if (!mongoose.isValidObjectId(id)) throw new ClientError("Invalid category id", 400);

      const deleted = await CategoryModel.findByIdAndDelete(id);
      if (!deleted) throw new ClientError("Category not found", 404);

      return res.json({ message: "Category successfully deleted", status: 200 });
    } catch (err) {
      next(err);
    }
  },
};
