const fs = require("fs");
let items = [];
let categories = [];

module.exports = {
    initialize() {
        return new Promise((resolve, reject) => {
            fs.readFile("./data/items.json", "utf8", (err, data) => {
                if (err) {
                    reject("unable to read file");
                } else {
                    items = JSON.parse(data);
                    fs.readFile(
                        "./data/categories.json",
                        "utf8",
                        (err, data) => {
                            if (err) {
                                reject("unable to read file");
                            } else {
                                categories = JSON.parse(data);
                                resolve();
                            }
                        }
                    );
                }
            });
        });
    },
    getAllItems() {
        return new Promise((resolve, reject) => {
            if (items.length > 0) {
                resolve(items);
            } else {
                reject("no results returned");
            }
        });
    },
    getPublishedItems() {
        return new Promise((resolve, reject) => {
            const publishedItems = items.filter(
                (item) => item.published === true
            );
            if (publishedItems.length > 0) {
                resolve(publishedItems);
            } else {
                reject("no results returned");
            }
        });
    },
    getCategories() {
        return new Promise((resolve, reject) => {
            if (categories.length > 0) {
                resolve(categories);
            } else {
                reject("no results returned");
            }
        });
    },
};
