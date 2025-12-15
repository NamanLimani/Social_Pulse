module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/mongodb [external] (mongodb, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongodb", () => require("mongodb"));

module.exports = mod;
}),
"[project]/dashboard/lib/mongodb.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/mongodb.ts
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongodb [external] (mongodb, cjs)");
;
if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
const uri = process.env.MONGODB_URI;
const options = {};
let client;
let clientPromise;
if ("TURBOPACK compile-time truthy", 1) {
    let globalWithMongo = /*TURBOPACK member replacement*/ __turbopack_context__.g;
    if (!globalWithMongo._mongoClientPromise) {
        client = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$29$__["MongoClient"](uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else //TURBOPACK unreachable
;
const __TURBOPACK__default__export__ = clientPromise;
}),
"[project]/dashboard/app/api/dashboard/advanced/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashboard/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashboard/lib/mongodb.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const client = await __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"];
        const db = client.db("bigdata");
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();
        // ------------------------------
        // 1. TRENDING TOPICS
        // ------------------------------
        if (type === "trending_topics") {
            const docs = await db.collection("topics").aggregate([
                {
                    $match: {
                        created_at: {
                            $gte: oneDayAgo,
                            $lte: now
                        }
                    }
                },
                {
                    $group: {
                        _id: "$topic",
                        count: {
                            $sum: 1
                        },
                        keywords: {
                            $first: "$topic_keywords"
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                },
                {
                    $limit: 10
                }
            ]).toArray();
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(docs.map((d)=>({
                    topic_keywords: d.keywords || [],
                    count: d.count
                })));
        }
        // ------------------------------
        // 2. ANOMALY TIMELINE (HOURLY)
        // ------------------------------
        if (type === "anomaly_timeline") {
            const timeline = await db.collection("anomalies").aggregate([
                {
                    $addFields: {
                        conv: {
                            $toDate: "$created_at"
                        }
                    }
                },
                {
                    $match: {
                        conv: {
                            $gte: new Date(oneDayAgo)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            hour: {
                                $hour: "$conv"
                            }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        "_id.hour": 1
                    }
                }
            ]).toArray();
            const full = Array.from({
                length: 24
            }, (_, hr)=>{
                const found = timeline.find((t)=>t._id.hour === hr);
                return {
                    hour: hr,
                    count: found?.count ?? 0
                };
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(full);
        }
        // ------------------------------
        // 3. ANOMALY FREQUENCY BY TOPIC
        // ------------------------------
        if (type === "anomaly_frequency") {
            const freq = await db.collection("anomalies").aggregate([
                {
                    $match: {
                        created_at: {
                            $gte: oneDayAgo,
                            $lte: now
                        }
                    }
                },
                {
                    $group: {
                        _id: "$topic",
                        count: {
                            $sum: 1
                        },
                        keywords: {
                            $first: "$topic_keywords"
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                }
            ]).toArray();
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(freq.map((f)=>({
                    topic_keywords: f.keywords || [],
                    count: f.count
                })));
        }
        // ------------------------------
        // 4. ENTITY ANALYTICS (TOP 10)
        // ------------------------------
        if (type === "entities_top") {
            const entities = await db.collection("entities").aggregate([
                {
                    $match: {
                        created_at: {
                            $gte: oneDayAgo,
                            $lte: now
                        }
                    }
                },
                {
                    $unwind: "$entities"
                },
                {
                    $match: {
                        "entities.label": {
                            $in: [
                                "PERSON",
                                "ORG",
                                "GPE",
                                "EVENT",
                                "PRODUCT",
                                "WORK_OF_ART"
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$entities.text",
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                },
                {
                    $limit: 10
                }
            ]).toArray();
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(entities.map((e)=>({
                    entity: e._id,
                    count: e.count
                })));
        }
        // ------------------------------
        // 5. HASHTAG ANALYTICS (TOP 20)
        // ------------------------------
        if (type === "hashtags_top") {
            const tags = await db.collection("hashtags").aggregate([
                {
                    $match: {
                        created_at: {
                            $gte: oneDayAgo,
                            $lte: now
                        }
                    }
                },
                {
                    $unwind: "$hashtags"
                },
                {
                    $group: {
                        _id: "$hashtags",
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                },
                {
                    $limit: 20
                }
            ]).toArray();
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(tags.map((t)=>({
                    hashtag: t._id,
                    count: t.count
                })));
        }
        // ------------------------------
        // 6. SUMMARY FEED
        // ------------------------------
        if (type === "summaries") {
            const list = await db.collection("summaries").find({
                created_at: {
                    $gte: oneDayAgo,
                    $lte: now
                }
            }).sort({
                created_at: -1
            }).limit(30).toArray();
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(list.map((s)=>({
                    summary: s.summary,
                    text: s.text,
                    sentiment: s.sentiment,
                    topic_keywords: s.topic_keywords?.slice(0, 3) || []
                })));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Invalid type"
        });
    } catch (err) {
        console.error("ADVANCED API ERROR:", err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Advanced API failed"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e08a72c2._.js.map