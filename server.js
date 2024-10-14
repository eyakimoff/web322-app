/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Eric Yakimoff
Student ID: 165296237
Date: [Add Today's Date]
Vercel Web App URL: 
GitHub Repository URL: 

********************************************************************************/

const express = require("express");
const path = require("path");
const storeService = require("./store-service");
const app = express();
const PORT = process.env.PORT || 8080;

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
    storeService
        .getAllItems()
        .then((data) => res.json(data))
        .catch((err) => res.json({ message: err }));
});

// Route to serve all categories
app.get("/categories", (req, res) => {
    storeService
        .getCategories()
        .then((data) => res.json(data))
        .catch((err) => res.json({ message: err }));
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
