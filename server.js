/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Eric Yakimoff
Student ID: 165296237
Date: 1/11/2024
Vercel Web App URL: 
GitHub Repository URL: 

********************************************************************************/

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const express = require("express");
const path = require("path");
const storeService = require("./store-service");
const app = express();
const PORT = process.env.PORT || 8080;

// Configure Cloudinary (add your credentials here)
cloudinary.config({
    cloud_name: "dwzcripaj",
    api_key: "543939491185214",
    api_secret: "WNpHR63k9lByLOIlO3IxK7iyCq4",
    secure: true,
});

// Initialize multer without disk storage
const upload = multer();

// Serve static files from the "public" folder
app.use(express.static("public"));

// Redirect root URL to the About page
app.get("/", (req, res) => {
    res.redirect("/about");
});

// Route to serve the About page
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views/about.html"));
});

// Route to serve the Shop page, showing published items
app.get("/shop", (req, res) => {
    storeService
        .getPublishedItems()
        .then((data) => res.json(data))
        .catch((err) => res.json({ message: err }));
});

// Route to serve all items
app.get("/items", (req, res) => {
    // Check for "category" query parameter
    if (req.query.category) {
        storeService
            .getItemsByCategory(req.query.category)
            .then((data) => res.json(data))
            .catch((err) => res.json({ message: err }));
    }
    // Check for "minDate" query parameter
    else if (req.query.minDate) {
        storeService
            .getItemsByMinDate(req.query.minDate)
            .then((data) => res.json(data))
            .catch((err) => res.json({ message: err }));
    }
    // No query parameters, return all items
    else {
        storeService
            .getAllItems()
            .then((data) => res.json(data))
            .catch((err) => res.json({ message: err }));
    }
});

// Route to serve all categories
app.get("/categories", (req, res) => {
    storeService
        .getCategories()
        .then((data) => res.json(data))
        .catch((err) => res.json({ message: err }));
});

// Route for /items/add
app.get("/items/add", (req, res) => {
    res.sendFile(path.join(__dirname, "views/addItem.html"));
});

app.get("/item/:value", (req, res) => {
    const itemId = parseInt(req.params.value, 10); // Parse the item ID from the URL

    storeService
        .getItemById(itemId)
        .then((data) => res.json(data))
        .catch((err) => res.status(404).json({ message: err })); // Return 404 if item not found
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
            console.log(result); // Log Cloudinary upload result
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
        req.body.featureImage = imageUrl; // Set the image URL in the request body

        // Use storeService.addItem to add the new item
        storeService
            .addItem(req.body)
            .then(() => {
                res.redirect("/items"); // Redirect to /items after adding the item
            })
            .catch((err) => {
                console.error("Error adding item:", err);
                res.status(500).send("Unable to add item");
            });
    }
});

// Error handling for any undefined routes
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// Initialize the data from store-service and start the server
storeService
    .initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Error initializing data: ${err}`);
    });
