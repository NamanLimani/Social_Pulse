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
"[project]/dashboard/app/api/dashboard/charts/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const client = await __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"];
    const db = client.db('bigdata');
    try {
        /**
     * SENTIMENT DISTRIBUTION — last 10 minutes
     */ if (type === 'sentiment_dist') {
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const now = new Date().toISOString();
            const stats = await db.collection('sentiment').aggregate([
                {
                    $match: {
                        created_at: {
                            $gte: tenMinsAgo,
                            $lte: now
                        }
                    }
                },
                {
                    $group: {
                        _id: '$sentiment',
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]).toArray();
            const result = {
                positive: 0,
                negative: 0,
                neutral: 0,
                unknown: 0,
                total: 0
            };
            stats.forEach((row)=>{
                if (row._id in result) {
                    const key = row._id;
                    if (key !== 'total') result[key] = row.count;
                }
                result.total += row.count;
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        /**
     * HOURLY ENGAGEMENT — last 24 hours
     */ if (type === 'activity_hourly') {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const activity = await db.collection('language').aggregate([
                {
                    $addFields: {
                        convertedDate: {
                            $toDate: '$created_at'
                        }
                    }
                },
                {
                    $match: {
                        convertedDate: {
                            $gte: oneDayAgo
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $hour: '$convertedDate'
                        },
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ]).toArray();
            const data = new Array(24).fill(0);
            activity.forEach((bucket)=>{
                if (bucket._id >= 0 && bucket._id < 24) data[bucket._id] = bucket.count;
            });
            const labels = Array.from({
                length: 24
            }, (_, i)=>`${i.toString().padStart(2, '0')}:00`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                labels,
                data
            });
        }
        /**
     * LANGUAGE DISTRIBUTION — last 24 hours
     */ if (type === 'language_dist') {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const now = new Date().toISOString();
            const langAgg = await db.collection('language').aggregate([
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
                        _id: '$lang',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                }
            ]).toArray();
            const labels = langAgg.map((row)=>row._id === null || row._id === '' ? 'unknown' : String(row._id));
            const data = langAgg.map((row)=>row.count);
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                labels,
                data
            });
        }
        /**
     * TOPIC DISTRIBUTION — FIXED (uses topic_keywords, NOT Topic 1/2/3)
     */ if (type === 'topic_dist') {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const now = new Date().toISOString();
            const topicAgg = await db.collection('topics').aggregate([
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
                        _id: '$topic',
                        count: {
                            $sum: 1
                        },
                        keywords: {
                            $first: '$topic_keywords'
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
            const labels = topicAgg.map((row)=>{
                if (Array.isArray(row.keywords) && row.keywords.length > 0) {
                    return row.keywords.slice(0, 3).join(', ');
                }
                return `Topic ${row._id}`;
            });
            const data = topicAgg.map((row)=>row.count);
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                labels,
                data
            });
        }
        /**
     * SENTIMENT TIMELINE — 24h grouped by hour
     */ if (type === 'sentiment_timeline') {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const raw = await db.collection('sentiment').aggregate([
                {
                    $addFields: {
                        convertedDate: {
                            $toDate: '$created_at'
                        }
                    }
                },
                {
                    $match: {
                        convertedDate: {
                            $gt: oneDayAgo
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            hour: {
                                $hour: '$convertedDate'
                            }
                        },
                        positive: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            '$sentiment',
                                            'positive'
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        neutral: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            '$sentiment',
                                            'neutral'
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        negative: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            '$sentiment',
                                            'negative'
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        unknown: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            '$sentiment',
                                            'unknown'
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $sort: {
                        '_id.hour': 1
                    }
                }
            ]).toArray();
            const timeline = Array.from({
                length: 24
            }, (_, hr)=>{
                const match = raw.find((r)=>r._id.hour === hr);
                return {
                    hour: hr,
                    positive: match?.positive ?? 0,
                    neutral: match?.neutral ?? 0,
                    negative: match?.negative ?? 0,
                    unknown: match?.unknown ?? 0
                };
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                timeline
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json([]);
    } catch (e) {
        console.error('Chart route error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Chart data failed'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__40c2064c._.js.map