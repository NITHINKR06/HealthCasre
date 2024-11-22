const userModel = require("../models/userModels");

// Block/Unblock User
const toggleBlockUser = async (req, res) => {
  try {
    const { userId, isUserBlock } = req.body;
    console.log(req.body)

    const user = await userModel.findByIdAndUpdate(
        userId,
        {isUserBlock},
        { new: true }
    );

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user) {
      user.notifcation = user.notifcation || [];
      user.notifcation.push({
        type: "Account update",
        message: `Your account status has been updated to: ${isUserBlock}`,
        onClickPath: "/admin/users",
      });
      await user.save();
    }

    res.status(200).send({
      success: true,
      message: `User ${user.isUserBlock ? "blocked" : "unblocked"} successfully.`,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error toggling block status.",
      error,
    });
  }
};

module.exports = { toggleBlockUser };
