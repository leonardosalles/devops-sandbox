"use strict";
exports.handler = async (event) => {
    console.log("AppSync event", JSON.stringify(event));
    return "Lambda Resolver";
};
