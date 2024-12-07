/*********************************************************************************

WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or
electronically from any other source (including 3rd party web sites) or
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course.

Name: Eric Yakimoff
Student ID: 165296237
Date: 12/07/24
Vercel Web App URL: https://web322-app-kappa-six.vercel.app/
GitHub Repository URL: https://github.com/eyakimoff/web322-app

********************************************************************************/

const express = require("express");
const itemData = require("./store-service");
const path = require("path");

// 3 new modules, multer, cloudinary, streamifier
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// AS4, Setup handlebars
const exphbs = require("express-handlebars");
const { Console } = require("console");

const clientSessions = require("client-sessions");
const bcrypt = require("bcryptjs");
const authData = require("./auth-service");
const storeData = require("./store-service");

// Configure Cloudinary. This API information is
// inside of the Cloudinary Dashboard - https://console.cloudinary.com/
cloudinary.config({
    cloud_name: "",
    api_key: "",
    api_secret: "",
    secure: true,
});

//  "upload" variable without any disk storage
const upload = multer(); // no { storage: storage }

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//This will add the property "activeRoute" to "app.locals" whenever the route changes, i.e. if our route is "/store/5", the app.locals.activeRoute value will be "/store".  Also, if the shop is currently viewing a category, that category will be set in "app.locals".
app.use(function (req, res, next) {
    let route = req.path.substring(1);

    app.locals.activeRoute =
        "/" +
        (isNaN(route.split("/")[1])
            ? route.replace(/\/(?!.*)/, "")
            : route.replace(/\/(.*)/, ""));

    app.locals.viewingCategory = req.query.category;

    next();
});

// Handlebars Setup
app.engine(
    ".hbs",
    exphbs.engine({
        extname: ".hbs",
        helpers: {
            formatDate: function (dateObj) {
                let year = dateObj.getFullYear();
                let month = (dateObj.getMonth() + 1).toString();
                let day = dateObj.getDate().toString();
                return `${year}-${month.padStart(2, "0")}-${day.padStart(
                    2,
                    "0"
                )}`;
            },

            navLink: function (url, options) {
                return (
                    '<li class="nav-item"><a ' +
                    (url == app.locals.activeRoute
                        ? ' class="nav-link active" '
                        : ' class="nav-link" ') +
                    ' href="' +
                    url +
                    '">' +
                    options.fn(this) +
                    "</a></li>"
                );
            },

            equal: function (lvalue, rvalue, options) {
                if (arguments.length < 3)
                    throw new Error(
                        "Handlebars Helper equal needs 2 parameters"
                    );
                if (lvalue != rvalue) {
                    return options.inverse(this);
                } else {
                    return options.fn(this);
                }
            },
        },
    })
);

app.set("view engine", ".hbs");

app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/shop", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};

    try {
        // declare empty array to hold "item" objects
        let items = [];

        // if there's a "category" query, filter the returned items by category
        if (req.query.category) {
            // Obtain the published "items" by category
            console.log("categories");
            items = await itemData.getPublishedItemsByCategory(
                req.query.category
            );
        } else {
            // Obtain the published "items"
            items = await itemData.getPublishedItems();
        }

        // sort the published items by postDate
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest item from the front of the list (element 0)
        let item = items[0];

        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
});

// Accept queryStrings
app.get("/items", (req, res) => {
    let queryPromise = null;

    // check if there is a query for Category
    if (req.query.category) {
        queryPromise = itemData.getItemsByCategory(req.query.category);
    } else if (req.query.minDate) {
        queryPromise = itemData.getItemsByMinDate(req.query.minDate);
    } else {
        queryPromise = itemData.getAllItems();
    }

    queryPromise
        .then((data) => {
            if (data.length > 0) {
                res.render("items", { items: data });
            } else {
                res.render("items", { message: "no results" });
            }
        })
        .catch(() => {
            res.render("items", { message: "no results" });
        });
});

// A route for items/add
app.get("/items/add", (req, res) => {
    itemData
        .getCategories()
        .then((data) => {
            // Render the view with categories data
            res.render("addItem", { categories: data });
        })
        .catch(() => {
            // Render the view with an empty categories array if fetching categories fails
            res.render("addItem", { categories: [] });
        });
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);

            console.log(result);

            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        // TODO: Process the req.body and add it as a new Item before redirecting to /items
        itemData
            .addItem(req.body)
            .then((post) => {
                res.redirect("/items");
            })
            .catch((err) => {
                res.status(500).send(err);
            });
    }
});

// Get an individual item
app.get("/item/:id", (req, res) => {
    itemData
        .getItemById(req.params.id)
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.json({ message: err });
        });
});

app.get("/categories", (req, res) => {
    itemData
        .getCategories()
        .then((data) => {
            if (data.length > 0) {
                res.render("categories", { categories: data });
            } else {
                res.render("categories", { message: "no results" });
            }
        })
        .catch(() => {
            res.render("categories", { message: "no results" });
        });
});

app.get("/shop/:id", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};

    try {
        // declare empty array to hold "item" objects
        let items = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            items = await itemData.getPublishedItemsByCategory(
                req.query.category
            );
        } else {
            // Obtain the published "posts"
            items = await itemData.getPublishedItems();
        }

        // sort the published items by postDate
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
});

itemData
    .initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log("server listening on: " + HTTP_PORT);
        });
    })
    .catch((err) => {
        console.log(err);
    });

app.get("/categories/add", (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
    itemData
        .addCategory(req.body)
        .then(() => {
            res.redirect("/categories"); // Redirect to categories view
        })
        .catch((err) => {
            res.status(500).send("Unable to create category");
        });
});

app.get("/categories/delete/:id", (req, res) => {
    itemData
        .deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories"); // Redirect to categories view
        })
        .catch((err) => {
            res.status(500).send(
                "Unable to Remove Category / Category not found"
            );
        });
});

app.get("/items/delete/:id", (req, res) => {
    itemData
        .deleteItemById(req.params.id)
        .then(() => {
            res.redirect("/items"); // Redirect to the items view on success
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Item / Item not found"); // Error response
        });
});

authData
    .initialize()
    .then(storeData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log("App listening on " + HTTP_PORT);
        });
    })
    .catch((err) => {
        console.log("Unable to start server: " + err);
    });

app.use(
    clientSessions({
        cookieName: "session",
        secret: "web322_assignment6_secret",
        duration: 2 * 60 * 1000, // 2 minutes
        activeDuration: 1000 * 60, // Extend session by 1 minute if active
    })
);

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
};

app.get("/login", (req, res) => {
    console.log("Login route accessed");
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData
        .registerUser(req.body)
        .then(() => res.render("register", { successMessage: "User created" }))
        .catch((err) =>
            res.render("register", {
                errorMessage: err,
                userName: req.body.userName,
            })
        );
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");

    authData
        .checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory,
            };
            res.redirect("/items");
        })
        .catch((err) =>
            res.render("login", {
                errorMessage: err,
                userName: req.body.userName,
            })
        );
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

app.use((req, res) => {
    res.status(404).render("404");
});
