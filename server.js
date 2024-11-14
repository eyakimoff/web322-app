const express = require("express");
const path = require("path");
const itemData = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars"); // Import express-handlebars
const stripJs = require("strip-js"); // Import strip-js package

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary config (use your actual credentials here)
cloudinary.config({
    cloud_name: "dwzcripaj",
    api_key: "543939491185214",
    api_secret: "WNpHR63k9lByLOIlO3IxK7iyCq4",
    secure: true,
});

// Initialize multer without disk storage
const upload = multer();

// Set the views directory for Express
app.set("views", path.join(__dirname, "views"));

// Initialize Handlebars and register helpers
const handlebars = exphbs.create({
    extname: ".hbs",
    helpers: {
        // Register the "safeHTML" helper to strip unwanted JavaScript
        safeHTML: function (context) {
            return stripJs(context);
        },

        // Register the "navLink" helper
        navLink: function (url, options) {
            return `<li class="${
                app.locals.activeRoute === url ? "active" : ""
            }"><a href="${url}">${options.fn(this)}</a></li>`;
        },

        // Register the "equals" helper
        equals: function (lvalue, rvalue, options) {
            if (arguments.length < 3) {
                throw new Error("Handlebars Helper equal needs 2 parameters");
            }
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
    },
});

// Set up the Handlebars engine
app.engine(".hbs", handlebars.engine);
app.set("view engine", ".hbs");

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.redirect("/shop");
});

// Route to serve the About page
app.get("/about", (req, res) => {
    res.render("about", { title: "About" });
});

// Route to serve the Shop page, showing published items

app.get("/shop", async (req, res) => {
    let viewData = {};
    let category = req.query.category;

    try {
        let items = [];

        if (category) {
            items = await itemData.getPublishedItemsByCategory(category);
        } else {
            items = await itemData.getPublishedItems();
        }

        // Sort and store items
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

        let item = items[0]; // Take the first item as the featured item
        viewData.items = items; // Store items in viewData
        viewData.item = item; // Store featured item
    } catch (err) {
        viewData.message = err || "No results found for items.";
    }

    try {
        let categories = await itemData.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = err || "No categories found.";
    }

    res.render("shop", { data: viewData }); // Pass viewData to the view
});

app.get("/shop/:id", async (req, res) => {
    let viewData = {};

    try {
        // Fetch all published items based on category if provided
        let items = [];
        const category = req.query.category;

        if (category) {
            items = await itemData.getPublishedItemsByCategory(category);
        } else {
            items = await itemData.getPublishedItems();
        }

        // Sort items by postDate
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;

        // Fetch the specific item by ID
        const itemId = parseInt(req.params.id, 10); // Parse the item ID from the URL
        const item = await itemData.getItemById(itemId);
        viewData.item = item;
    } catch (err) {
        viewData.message = err || "No results found for items.";
    }

    try {
        const categories = await itemData.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = err || "No categories found.";
    }

    // Render the shop view with all the data
    res.render("shop", { data: viewData });
});

// Route to serve all items
app.get("/items", (req, res) => {
    // Check for "category" query parameter
    if (req.query.category) {
        itemData
            .getItemsByCategory(req.query.category)
            .then((data) => res.render("items", { items: data })) // Render items with the filtered data
            .catch((err) =>
                res.render("items", { message: "No results found" })
            ); // Show error message if no items found
    }
    // Check for "minDate" query parameter
    else if (req.query.minDate) {
        itemData
            .getItemsByMinDate(req.query.minDate)
            .then((data) => res.render("items", { items: data })) // Render items with filtered data by minDate
            .catch((err) =>
                res.render("items", { message: "No results found" })
            );
    }
    // No query parameters, return all items
    else {
        itemData
            .getAllItems()
            .then((data) => res.render("items", { items: data })) // Render all items
            .catch((err) =>
                res.render("items", { message: "No results found" })
            );
    }
});

// Route for /items/add
app.get("/items/add", (req, res) => {
    res.render("addItem", { title: "Add Item" });
});

app.get("/item/:value", (req, res) => {
    const itemId = parseInt(req.params.value, 10);
    itemData
        .getItemById(itemId)
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err }));
});

// Add new item
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

        upload(req)
            .then((uploaded) => {
                processItem(uploaded.url); // Pass the uploaded image URL to processItem
            })
            .catch((error) => {
                console.error("Cloudinary upload error:", error);
                processItem(""); // In case of error, call processItem with an empty URL
            });
    } else {
        processItem(""); // No file uploaded, call processItem with an empty URL
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        itemData
            .addItem(req.body)
            .then(() => {
                res.redirect("/items");
            })
            .catch((err) => {
                console.error("Error adding item:", err);
                res.status(500).send("Unable to add item");
            });
    }
});

// Route to serve all categories
app.get("/categories", (req, res) => {
    itemData
        .getCategories()
        .then((data) => res.render("categories", { categories: data })) // Render categories with data
        .catch((err) =>
            res.render("categories", { message: "No results found" })
        ); // Show error message if no categories found
});

// Error handling for any undefined routes
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// Initialize the data from store-service and start the server
itemData
    .initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Error initializing data: ${err}`);
    });

// Helper functions to manage active route and category
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
