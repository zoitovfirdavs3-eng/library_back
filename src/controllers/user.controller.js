const UserModel = require("../models/User.model");
const { ClientError } = require("shokhijakhon-error-handler");

module.exports = {
  async ME(req, res, next) {
    try {
      const user = await UserModel.findById(req.user_id).select("-password");
      if (!user) throw new ClientError("User not found", 404);
      return res.json({ status: 200, data: user });
    } catch (e) { next(e); }
  },

  async UPDATE_ME(req, res, next) {
    try {
      const allowed = ["first_name", "last_name", "phone"];
      const data = {};
      for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];

      const user = await UserModel.findByIdAndUpdate(req.user_id, data, {
        new: true,
        runValidators: true,
        select: "-password",
      });

      if (!user) throw new ClientError("User not found", 404);
      return res.json({ status: 200, data: user, message: "Profile updated" });
    } catch (e) { next(e); }
  },
};
