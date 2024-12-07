/********************************************************************************* 

WEB322 – Assignment 02 
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   
Student ID:   
Date:  
Cyclic Web App URL:  
GitHub Repository URL:  

********************************************************************************/

const Sequelize = require("sequelize");

// Replace 'database', 'user', 'password', and 'host' with your actual credentials
var sequelize = new Sequelize("SenecaDB", "SenecaDB_owner", "a6NIALonhgm3", {
    host: "ep-summer-glitter-a5ez5y9y.us-east-2.aws.neon.tech",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }, // Ensures SSL connection
    },
    query: { raw: true }, // Returns plain JavaScript objects
});

const fs = require("fs");

let items = [];
let categories = [];

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize
            .sync()
            .then(() => {
                console.log("Database synced successfully.");
                resolve();
            })
            .catch((err) => {
                console.error("Unable to sync the database:", err);
                reject("unable to sync the database");
            });
    });
};

module.exports.getAllItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

module.exports.getItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { category: category } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

module.exports.getItemsByMinDate = function (minDateStr) {
    const { gte } = Sequelize.Op; // Sequelize operator for greater than or equal
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                itemDate: {
                    [gte]: new Date(minDateStr),
                },
            },
        })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

module.exports.getItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { id: id } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data[0]); // Return the first matching item
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

module.exports.addItem = function (itemData) {
    return new Promise((resolve, reject) => {
        // Ensure published is explicitly set
        itemData.published = itemData.published ? true : false;

        // Replace blank fields with null
        for (const prop in itemData) {
            if (itemData[prop] === "") {
                itemData[prop] = null;
            }
        }

        // Set the current date for itemDate
        itemData.itemDate = new Date();

        // Create the item in the database
        Item.create(itemData)
            .then(() => resolve())
            .catch(() => reject("unable to create item"));
    });
};

module.exports.getPublishedItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

module.exports.getPublishedItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true, category: category } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject("no results returned");
                }
            })
            .catch((err) => reject("no results returned"));
    });
};

// Define the Item model
const Item = sequelize.define("Item", {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    itemDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE,
});

// Define the Category model
const Category = sequelize.define("Category", {
    category: Sequelize.STRING,
});

// Define the relationship
Item.belongsTo(Category, { foreignKey: "category" });

sequelize
    .sync()
    .then(() => {
        console.log("Database synced successfully.");
    })
    .catch((err) => {
        console.error("Unable to sync the database:", err);
    });

module.exports.addCategory = function (categoryData) {
    return new Promise((resolve, reject) => {
        // Replace blank fields with null
        for (const prop in categoryData) {
            if (categoryData[prop] === "") {
                categoryData[prop] = null;
            }
        }

        // Create the category in the database
        Category.create(categoryData)
            .then(() => resolve())
            .catch(() => reject("unable to create category"));
    });
};

module.exports.deleteCategoryById = function (id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id },
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve();
                } else {
                    reject("Category not found");
                }
            })
            .catch(() => reject("unable to delete category"));
    });
};

module.exports.deleteItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id },
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve();
                } else {
                    reject("Item not found");
                }
            })
            .catch(() => reject("unable to delete item"));
    });
};

module.exports.deleteItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id },
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve(); // Item deleted successfully
                } else {
                    reject("Item not found"); // No matching item found
                }
            })
            .catch(() => reject("Unable to delete item")); // Error during deletion
    });
};
