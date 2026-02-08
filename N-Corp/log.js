module.exports = {
    Print: (type, msg) => console.log(`[${type}] ${msg}`),
    Log: (msg) => console.log(`[LOG] ${msg}`),
    Error: (msg) => console.error(`[ERROR] ${msg}`)
};
