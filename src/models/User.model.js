const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    first_name: { 
      type: String, 
      required: [true, "Iltimos, ism kiriting"], 
      trim: true,
      minlength: [2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"],
      maxlength: [50, "Ism 50 ta belgidan oshmasligi kerak"]
    },
    last_name: { 
      type: String, 
      required: [true, "Iltimos, familya kiriting"], 
      trim: true,
      minlength: [2, "Familya kamida 2 ta belgidan iborat bo'lishi kerak"],
      maxlength: [50, "Familya 50 ta belgidan oshmasligi kerak"]
    },

    phone: { 
      type: String, 
      default: null, 
      trim: true,
      match: [/^\+?[0-9\s\-()]+$/, "Telefon raqam noto'g'ri formatda"]
    },

    email: { 
      type: String, 
      required: [true, "Iltimos, email kiriting"], 
      unique: true, 
      trim: true, 
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email noto'g'ri formatda"]
    },

    password: { 
      type: String, 
      required: [true, "Iltimos, parol kiriting"], 
      minlength: [6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"],
      select: false // Parolni olish uchun aniq so'rash kerak
    },

    role: { 
      type: String, 
      enum: ["user", "admin", "super_admin"], 
      default: "user" 
    },

    // OTP uchun maydonlar
    is_verified: { 
      type: Boolean, 
      default: false,
      index: true // Tezroq qidirish uchun indeks
    },
    
    otp_hash: { 
      type: String, 
      default: null,
      select: false // Xavfsizlik uchun defaultda olinmasin
    },
    
    otp_expires: { 
      type: Date, 
      default: null,
      index: true // Tezroq tekshirish uchun indeks
    },
    
    otp_attempts: { 
      type: Number, 
      default: 0,
      min: [0, "Urinishlar soni manfiy bo'lishi mumkin emas"],
      max: [10, "Urinishlar soni 10 dan oshmasligi kerak"]
    },
    
    otp_last_sent_at: { 
      type: Date, 
      default: null,
      index: true // Cooldown tekshirish uchun indeks
    },

    settings: {
      language: { 
        type: String, 
        enum: ["uz", "ru", "en"], 
        default: "uz" 
      },
      theme: { 
        type: String, 
        enum: ["dark", "light"], 
        default: "dark" 
      },
    },
  },
  { 
    timestamps: true, 
    versionKey: false,
    // Indexlar
    index: [
      { email: 1 }, // Email bo'yicha unikalik va qidirish
      { is_verified: 1 }, // Tasdiqlanmagan foydalanuvchilar uchun
      { otp_expires: 1 }, // Muddati o'tgan OTPlar uchun
    ]
  }
);

// Parolni saqlashdan oldin hashlash
userSchema.pre("save", async function (next) {
  // Faqat parol o'zgarganda hashlash
  if (!this.isModified("password")) return next();
  
  try {
    const bcrypt = require("bcrypt");
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Parolni solishtirish uchun metod
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require("bcrypt");
  return await bcrypt.compare(candidatePassword, this.password);
};

// OTP ni tekshirish uchun metod
userSchema.methods.isOTPValid = function (otp) {
  const bcrypt = require("bcrypt");
  
  // Muddati o'tganmi
  if (!this.otp_expires || new Date() > this.otp_expires) {
    return false;
  }
  
  // Urinishlar soni cheklanganmi
  if (this.otp_attempts >= 5) {
    return false;
  }
  
  // OTP ni tekshirish
  return bcrypt.compareSync(otp, this.otp_hash);
};

// OTP maydonlarini tozalash uchun metod
userSchema.methods.clearOTP = function () {
  this.otp_hash = undefined;
  this.otp_expires = undefined;
  this.otp_attempts = 0;
};

// JSON ga o'tganda parolni olib tashlash
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.otp_hash;
  return userObject;
};

module.exports = model("users", userSchema);
