module.exports = {
    collection: (name) => ({
        findOne: async (query) => {
            // Mock Login Logic
            if (query.key === "admin" || (query.user === "admin" && query.role)) {
                return {
                    user: "admin",
                    pass: "admin",
                    role: query.role,
                    key: "admin",
                    hwid: "dev-hwid",
                    validTill: Date.now() + 100000000
                };
            }
            return null;
        },
        updateOne: async () => ({ modifiedCount: 1 }),
        insertOne: async () => ({ insertedId: "mock-id" })
    })
};
