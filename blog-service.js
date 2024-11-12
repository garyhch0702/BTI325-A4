const fs = require('fs');
const path = require('path');

let posts = [];
let categories = [];

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data/posts.json'), 'utf8', (err, data) => {
            if (err) reject(err);
            else {
                posts = JSON.parse(data);
                fs.readFile(path.join(__dirname, 'data/categories.json'), 'utf8', (err, data) => {
                    if (err) reject(err);
                    else {
                        categories = JSON.parse(data);
                        resolve();
                    }
                });
            }
        });
    });
};

module.exports.getAllPosts = function () {
    return new Promise((resolve, reject) => {
        posts.length > 0 ? resolve(posts) : reject('no results returned');
    });
};

module.exports.getPostsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        const filteredPosts = posts.filter((post) => post.category == category);
        filteredPosts.length > 0 ? resolve(filteredPosts) : reject('no results returned');
    });
};

module.exports.getPublishedPosts = function () {
    return new Promise((resolve, reject) => {
        const filteredPosts = posts.filter((post) => post.published);
        filteredPosts.length > 0 ? resolve(filteredPosts) : reject('no results returned');
    });
};

module.exports.getPublishedPostsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        const filteredPosts = posts.filter((post) => post.published && post.category == category);
        filteredPosts.length > 0 ? resolve(filteredPosts) : reject('no results returned');
    });
};

module.exports.addPost = function (postData) {
    return new Promise((resolve) => {
        postData.id = posts.length + 1;
        postData.postDate = new Date().toISOString().split('T')[0];
        posts.push(postData);
        resolve();
    });
};

module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        categories.length > 0 ? resolve(categories) : reject('no results returned');
    });
};

module.exports.getPostById = function (id) {
    return new Promise((resolve, reject) => {
        const foundPost = posts.find((post) => post.id == id);
        foundPost ? resolve(foundPost) : reject('no result returned');
    });
};
