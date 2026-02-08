require("dotenv").config({ override: true });

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const package = require(path.join(__dirname, "package.json"));

const http = require("http");
const express = require("express");
const session = require("express-session");
const handlebars = require("express-handlebars");
const { app, getWss } = require("express-ws")(express());

const t = require("./mongodb.js");
const { Print, Log, Error } = require("./log.js");

const client = require("redis").createClient({ port: 1080, host: "db.igrp.app", prefix: "n-corp:session" }), store = session({
    name: "session",
    secret: "N-Corp.Panel",
    resave: false, saveUninitialized: false,
    // store: new (require("connect-redis").RedisStore)({
    //     client: client
    // }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}),
    api = express.Router({ caseSensitive: true }).use(store), ajv = (new (require("ajv").Ajv)()).compile({
        type: "object",
        properties: {

        },
        additionalProperties: false
    }),
    defaultAjv = {

    };

app.engine(".hbs", handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main", layoutsDir: path.join(__dirname, "public"),

    helpers: {
        eq: (a, b, options) => options[a == b ? "fn" : "inverse"](this)
    }
}));

app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "public"));
app.set('trust proxy', true);

[
    ["/image/logo.png", "public/logo.png"],

    ["/js/main.js", "public/main.js"],
    ["/js/jquery.js", "public/jquery.js"],
    ["/js/tailwindcss.js", "public/tailwindcss.js"],

    ["/fonts/SourceCode-It.ttf", "public/SourceCode-It.ttf"],
    ["/fonts/SourceCode-Regular.ttf", "public/SourceCode-Regular.ttf"]
]
    .map(async ([route, p]) => {
        const file = fs.statSync(path.join(__dirname, p)), content = fs.readFileSync(path.join(__dirname, p));

        app.get(route, async (req, res) => {
            if (file.mtime.getTime() <= (new Date(req.headers["if-modified-since"]).getTime()))
                return res.status(304).send(null);

            res
                .setHeader("Content-Type", mime.lookup(path.join(__dirname, p)));

            res
                .setHeader("Last-Modified", file.mtime.toISOString())
                .setHeader("Cache-Control", "public, max-age=0, must-revalidate");
            return res.status(200).send(content);
        });
    });

app
    .use((req, res, next) => {
        Object.keys(req.query).forEach(i => {
            if (typeof req.query[i] == "string" && req.query[i].length == 0)
                delete req.query[i];
        });

        next();
    });

["api", "app"].forEach(i => app
    .use(async (err, req, res, next) => {
        Error(`Unhandled server error on route ${req.path}: ${err.stack}`);
        return res.status(200).jsonp(false, null, "Internal Server Error.");
    })
    .use(`/${i}`, express.json(), (req, res, next) => { res.jsonp = (status, data, message) => res.status(200).json(Object.assign({ status }, status ? { data } : { data: data || null, message })); next(); }));

[
    ["/", "index"],
    ["/login", "login"],
    ["/products", "products"]
]
    .map(([route, p]) => app.get(route, store, async ({ session }, res) => res.render(p, {
        isLogged: "session" in session
    })));

app
    .use("/api", api)
    .post("/api/login", async ({ query, session }, res) => {
        if (!query.role)
            return res.jsonp(false, null, "Select a role");

        if (["seller", "streamer", "key"].filter(i => query.role == i).length == 0)
            return res.jsonp(false, null, `Invalid role selected, selected: ${query.role}`);


        let account;

        if (query.role == "key") {
            if (!query.key)
                return res.jsonp(false, null, "Invalid License Key");

            account = await t.collection("license-key").findOne({ key: query.key, role: query.role })
        } else {

        };

        if ((query.role == "key" && !query.key) || (query.role != "key" && (!query.user || !query.pass)))
            return res.jsonp(false, null, query.role == "key" ? "Invalid credentials" : "Enter Username & Password");

        // const account = ;

        if (account)
            // Allow login if role is key OR password matches
            if (query.role == "key" || account.pass == query.pass) {
                session.session = {
                    role: query.role,
                    // Use key as user identifier if role is key
                    user: query.user || query.key,
                };

                return res.jsonp(true);
            } else
                return res.jsonp(false, "Incorrect Password");
        else
            return res.jsonp(false, "Invalid Username or Key");
    })
    .post("/api/register", async ({ query, session }, res) => {
        if (!query.role)
            return res.jsonp(false, "Select a role");

        if (!query.user || !query.pass || !query.license)
            return res.jsonp(false, "Enter Username, Password & License");

        if (["reseller", "user"].filter(i => query.role == i).length == 0)
            return res.jsonp(false, `Invalid role selected, selected: ${query.role}`);

        if (!(await t.collection("users").findOne({ user: query.user, role: query.role }))) {

        } else
            return res.jsonp(false, "Username already exists");
    });

app
    .get("/login", store, async ({ session }, res) => {
        if (session?.session)
            return res.redirect("/dashboard");
        else
            return res.render("login", {
                title: "Login"
            });
    })
    .get("/dashboard", store, async ({ path, session }, res) => {
        if (!session?.session)
            return res.redirect(`/login?redirect=${path}`);
        else
            return res.render("dashboard", {}, { layout: false });
    })
    .get("/logout", store, (req, res) => {
        req.session.destroy(() => {});
        res.redirect("/");
    });

api
    .get("/version", async ({ query }, res) => {
        if (query.product && query.product in package.product)
            return res.jsonp(true, {
                v: package.product[query.product]
            });
        else
            return res.jsonp(false, null, "Invalid Product");
    });

api
    .get("/login/key", async ({ query }, res) => {
        if (query.key && query.hwid)
            try {
                if (await t.collection("Rage").findOne({
                    $or: [
                        { hwid: "*" },
                        { hwid: query.hwid },
                    ],
                    key: query.key,
                    validTill: { $gt: Date.now() }
                }))
                    return res.json({ status: true });
                else
                    return res.jsonp(false, null, "License Expired");
            } catch { return res.json(false, null, "Internal Server Error"); };

        return res.jsonp(false, null, "Invalid Query");
    })
    .get("/login/uid", async ({ query }, res) => {
        if (query.uid)
            try {
                if (await t.collection("UID Bypass").findOne({
                    $or: [
                        { uid: "*" },
                        { uid: query.uid }
                    ],
                    validTill: { $gt: Date.now() }
                }))
                    return res.json({ status: true });
            } catch { return res.json({ status: false, message: "INTERNAL SERVER ERROR" }); };

        return res.json({ status: false, message: "UID NOT AUTHORIZED" });
    })
    .get("/login/hwid", async ({ query }, res) => {
        if (query.hwid)
            try {
                if (await t.collection("Streamer").findOne({
                    hwid: query.hwid,
                    validTill: { $gt: Date.now() }
                }))
                    return res.json({ status: true });
                else
                    return res.jsonp(false, null, "Plan Expired");
            } catch { return res.json(false, null, "Internal Server Error"); };

        return res.jsonp(false, null, "Invalid Query");
    });

api
    .get("/product/streamer", async ({ query }, res) => {
        if (query.hwid)
            try {
                if (await t.collection("Streamer").findOne({
                    hwid: query.hwid,
                    validTill: { $gt: Date.now() }
                })) {

                }
                else
                    return res.status(400).end();
            } catch { return res.status(500).end(); };

        return res.status(403).end();
    })
    .post("/register/streamer", async ({ query }, res) => {
        if (query.user && query.pass && query.sid)
            try {
                const doc = await t.collection("Streamer").findOne({
                    $or: [
                        { sid: "-", },
                        { sid: query.sid }
                    ],
                    user: query.user,
                    pass: query.pass,
                    validTill: { $gt: Date.now() }
                });

                if (doc) {
                    if (doc.sid == "-")
                        await t.collection("Streamer").updateOne({ _id: doc._id }, { sid: query.sid });

                    return res.jsonp(true);
                }
                else
                    return res.jsonp(false, null, "Plan Expired");
            } catch { return res.json(false, null, "Internal Server Error"); };

        return res.jsonp(false, null, "Invalid Query");
    });

["api", "app"].forEach(i => app.use(`/${i}`, (req, res) => res.status(200).jsonp(false, null, "Not Found.")));

const server = http.createServer(app);
const defaultPort = Number(process.env.PORT) || 8080;
const maxAttempts = 10;

function tryListen(port) {
    if (port > defaultPort + maxAttempts - 1) {
        console.error(`Could not start: ports ${defaultPort} to ${defaultPort + maxAttempts - 1} are in use. Stop the process (e.g. taskkill /F /IM node.exe) and try again.`);
        process.exit(1);
    }
    server.listen(port, "0.0.0.0")
        .once("listening", () => Print("http", `listening at http://localhost:${port} (PID ${process.pid})`))
        .once("error", (err) => {
            if (err.code === "EADDRINUSE") {
                Print("http", `port ${port} in use, trying ${port + 1}...`);
                tryListen(port + 1);
            } else
                throw err;
        });
}
tryListen(defaultPort);