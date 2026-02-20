const dataStore = {
    "license-key": [
        { key: "admin", role: "key", validTill: Date.now() + 1e11 },
        { key: "DEMO-KEY-1234", role: "key", validTill: Date.now() + 1e10 }
    ],
    "users": [
        { user: "admin", pass: "admin", role: "seller" },
        { user: "streamer", pass: "streamer", role: "streamer" }
    ],
    "Rage": [],
    "UID Bypass": [],
    "Streamer": []
};

module.exports = {
    collection: (name) => {
        if (!dataStore[name]) dataStore[name] = [];
        return {
            find: () => ({
                toArray: async () => dataStore[name]
            }),
            findOne: async (query) => {
                return dataStore[name].find(item => {
                    for (let key in query) {
                        if (query[key] && typeof query[key] === 'object' && query[key].$or) {
                            return query[key].$or.some(cond => item[Object.keys(cond)[0]] === Object.values(cond)[0]);
                        }
                        if (item[key] !== query[key]) return false;
                    }
                    return true;
                });
            },
            updateOne: async (query, update) => {
                const idx = dataStore[name].findIndex(item => item._id === query._id);
                if (idx !== -1) Object.assign(dataStore[name][idx], update.$set || update);
                return { modifiedCount: idx !== -1 ? 1 : 0 };
            },
            insertOne: async (doc) => {
                doc._id = Math.random().toString(36).substr(2, 9);
                dataStore[name].push(doc);
                return { insertedId: doc._id };
            },
            deleteOne: async (query) => {
                const idx = dataStore[name].findIndex(item => item._id === query._id || item.key === query.key || item.user === query.user);
                if (idx !== -1) dataStore[name].splice(idx, 1);
                return { deletedCount: idx !== -1 ? 1 : 0 };
            }
        };
    }
};
