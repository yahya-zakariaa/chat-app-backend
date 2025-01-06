import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [6, "password must be at least 6 characters"],
    },
    avatar: {
      type: String,
      default: "",
    },

    friends: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        friendshipDate: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    bio: {
      type: String,
      default: "",
      maxLength: [150, "bio must be less than 150 characters"],
    },
  },
  { timestamps: true }
);

userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    next(new Error(`${field} '${value}' already exists.`));
  } else {
    next();
  }
});

userSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();

  if (update.username) {
    const existingUser = await User.findOne({ username: update.username });
    if (existingUser && existingUser._id.toString() !== query._id?.toString()) {
      return next(new Error(`Username '${update.username}' is already taken.`));
    }
  }

  if (update.email) {
    const existingEmail = await User.findOne({ email: update.email });
    if (
      existingEmail &&
      existingEmail._id.toString() !== query._id?.toString()
    ) {
      return next(new Error(`Email '${update.email}' is already registered.`));
    }
  }

  next();
});
const User = mongoose.model("User", userSchema);
export default User;
