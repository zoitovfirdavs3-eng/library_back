const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ClientError } = require("shokhijakhon-error-handler");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(folderName) {
  const dir = path.join("uploads", folderName);
  ensureDir(dir);

  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    },
  });
}

function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ClientError("Only jpg, png, webp allowed", 400));
  }
  cb(null, true);
}

const uploadAuthorPhoto = multer({
  storage: makeStorage("authors"),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

const uploadBookCover = multer({
  storage: makeStorage("books"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { uploadAuthorPhoto, uploadBookCover };
