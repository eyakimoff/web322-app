const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

// Define user schema
const userSchema = new Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String,
        },
    ],
});

let User; // To be defined upon connection

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(
            "mongodb+srv://eyak:<Yak111201>@cluster0.u1x24.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        );

        db.on("error", (err) => {
            reject(err);
        });
        db.once("open", () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt
                .hash(userData.password, 10)
                .then((hash) => {
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser
                        .save()
                        .then(() => resolve())
                        .catch((err) => {
                            if (err.code === 11000) {
                                reject("User Name already taken");
                            } else {
                                reject(
                                    "There was an error creating the user: " +
                                        err
                                );
                            }
                        });
                })
                .catch(() =>
                    reject("There was an error encrypting the password")
                );
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then((user) => {
                if (!user) {
                    reject(`Unable to find user: ${userData.userName}`);
                } else {
                    bcrypt
                        .compare(userData.password, user.password)
                        .then((result) => {
                            if (result) {
                                user.loginHistory.push({
                                    dateTime: new Date().toString(),
                                    userAgent: userData.userAgent,
                                });

                                User.updateOne(
                                    { userName: user.userName },
                                    {
                                        $set: {
                                            loginHistory: user.loginHistory,
                                        },
                                    }
                                )
                                    .then(() => resolve(user))
                                    .catch((err) =>
                                        reject(
                                            "There was an error verifying the user: " +
                                                err
                                        )
                                    );
                            } else {
                                reject(
                                    `Incorrect Password for user: ${userData.userName}`
                                );
                            }
                        });
                }
            })
            .catch(() => reject(`Unable to find user: ${userData.userName}`));
    });
};
