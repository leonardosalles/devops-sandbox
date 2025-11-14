"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_1 = require("http");
const node_fetch_1 = require("node-fetch");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => res.send("backend up"));
// simple proxy to AppSync (for local demo)
app.post("/graphql", async (req, res) => {
    const url = process.env.APPSYNC_URL;
    if (!url)
        return res.status(500).send("no APPSYNC_URL");
    const r = await (0, node_fetch_1.default)(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
    });
    const j = await r.text();
    res.set("content-type", "application/json").send(j);
});
(0, http_1.createServer)(app).listen(3001, () => console.log("Backend listening on 3001"));
