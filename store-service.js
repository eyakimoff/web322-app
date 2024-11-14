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
                reject("No published items found.");
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

    getItemsByCategory(category) {
        return new Promise((resolve, reject) => {
            const filteredItems = items.filter(
                (item) => String(item.category) === String(category)
            );

            if (filteredItems.length > 0) {
                resolve(filteredItems);
            } else {
                reject("no results returned");
            }
        });
    },

    // Step 2: getItemsByMinDate function
    getItemsByMinDate(minDateStr) {
        return new Promise((resolve, reject) => {
            const minDate = new Date(minDateStr);
            const filteredItems = items.filter(
                (item) => new Date(item.postDate) >= minDate
            );
            if (filteredItems.length > 0) {
                resolve(filteredItems);
            } else {
                reject("no results returned");
            }
        });
    },

    // Step 3: getItemById function
    getItemById(id) {
        return new Promise((resolve, reject) => {
            const item = items.find((item) => item.id === id);
            if (item) {
                resolve(item);
            } else {
                reject("no result returned");
            }
        });
    },

    addItem(itemData) {
        return new Promise((resolve, reject) => {
            // Set published to false if undefined, otherwise set to true
            itemData.published = itemData.published !== undefined;

            // Assign a new unique id based on the length of the items array
            itemData.id = items.length + 1;

            // Add the current date as itemDate (formatted as YYYY-MM-DD)
            const currentDate = new Date();
            const itemDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
            itemData.itemDate = itemDate;

            // Add the new item to the items array
            items.push(itemData);

            // Save the updated items array to items.json to persist changes
            fs.writeFile(
                "./data/items.json",
                JSON.stringify(items, null, 2),
                (err) => {
                    if (err) {
                        reject("unable to write file");
                    } else {
                        resolve(itemData);
                    }
                }
            );
        });
    },

    getPublishedItemsByCategory(category) {
        return new Promise((resolve, reject) => {
            const publishedItems = items.filter(
                (item) =>
                    item.published && String(item.category) === String(category) // Ensure both are strings for comparison
            );
            if (publishedItems.length > 0) {
                resolve(publishedItems);
            } else {
                reject("No items found for this category.");
            }
        });
    },
};
