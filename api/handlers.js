import { isHttpUrl, handleDuplicateNames, decodeChineseName, extractDisplayName } from '../utils/linkUtils.js';
import { loadSubscribe } from '../parsers/subscribeParser.js';
import { generateShortId, isShortIdExists } from '../utils/shortUrlUtils.js';

// 解析 generateXrayUrl 生成的结果
export async function parseXrayUrlResult(xrayUrl) {
    try {
        // 从 URL 中提取 config 参数
        const url = new URL(xrayUrl);
        const configParam = url.searchParams.get("config");

        if (!configParam) {
            return { error: "未找到配置参数" };
        }

        // 解码配置内容
        const configContent = decodeURIComponent(configParam);

        // 按换行符分割
        const lines = configContent.split("\n").filter((line) =>
            line.trim() !== ""
        );

        const allLinks = []; // 存储所有链接
        const results = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (isHttpUrl(trimmedLine)) {
                // 如果是 HTTP/HTTPS 链接，调用 loadSubscribe
                const subscribeData = await loadSubscribe(trimmedLine);
                results.push({
                    type: "subscribe",
                    url: trimmedLine,
                    data: subscribeData,
                    error: subscribeData.length === 0
                        ? "订阅获取失败或为空"
                        : null,
                });

                // 将订阅数据中的链接添加到总链接列表
                if (Array.isArray(subscribeData) && subscribeData.length > 0) {
                    allLinks.push(...subscribeData);
                }
            } else {
                // 其他格式保持原样
                results.push({
                    type: "raw",
                    content: trimmedLine,
                });

                // 将原始链接添加到总链接列表
                allLinks.push(trimmedLine);
            }
        }

        // 处理重名问题，生成合并后的列表
        const duplicateResult = handleDuplicateNames(allLinks);
        const mergedLinks = duplicateResult.links;

        // 计算原始唯一名称数量（处理前，基于解码后的名称）
        const originalUniqueNames = new Set(allLinks.map(link => decodeChineseName(extractDisplayName(link)))).size;
        
        // 计算重名个数
        const duplicateCount = allLinks.length - originalUniqueNames;

        return {
            results,
            mergedLinks,
            hasDuplicates: duplicateResult.hasDuplicates,
            summary: {
                totalLinks: allLinks.length,
                originalUniqueNames: originalUniqueNames,
                uniqueNames: mergedLinks.length,
                duplicateCount: duplicateCount,
                protocols: [
                    ...new Set(mergedLinks.map((link) => link.protocol)),
                ],
            },
        };
    } catch (error) {
        console.error("解析 Xray URL 失败:", error);
        return { error: "解析失败: " + error.message };
    }
}

// 处理 /api/combine 接口
export async function handleCombineApi(req, url) {
    if (req.method !== "GET") {
        return new Response("仅支持 GET 请求", { 
            status: 405,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }

    try {
        const xrayUrl = url.searchParams.get("xrayUrl");
        const debug = url.searchParams.get("debug") === "true";

        if (!xrayUrl) {
            return new Response(
                JSON.stringify({ error: "缺少 xrayUrl 参数" }),
                {
                    status: 400,
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        const result = await parseXrayUrlResult(xrayUrl);

        // 检查是否有错误
        if (result.error) {
            return new Response(JSON.stringify(result), {
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            });
        }

        // 根据参数决定返回格式
        if (debug) {
            // debug=true: 返回完整的JSON结果
            return new Response(JSON.stringify(result), {
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            });
        } else {
            // debug=false: 返回文本格式
            const mergedLinks = result.mergedLinks || [];
            const textContent = mergedLinks.map((link) => {
                // 为了保持与debug模式的一致性，我们需要确保链接中的显示名称是解码后的
                // 但这里link.original已经是经过updateLinkDisplayName处理的，包含了正确的显示名称
                return link.original;
            }).join("\n");

            return new Response(textContent, {
                headers: {
                    "content-type": "text/plain; charset=utf-8",
                },
            });
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "服务器错误: " + error.message }),
            {
                status: 500,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );
    }
}

// 处理 /api/shorten 接口
export async function handleShortenApi(req, url, kv) {
    if (req.method !== "POST") {
        return new Response("仅支持 POST 请求", { 
            status: 405,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }

    try {
        const requestBody = await req.json();
        const { xrayUrl } = requestBody;

        if (!xrayUrl) {
            return new Response(
                JSON.stringify({ error: "缺少 xrayUrl 参数" }),
                {
                    status: 400,
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 验证xrayUrl是否有效
        try {
            const testUrl = new URL(xrayUrl);
            if (!testUrl.searchParams.get("config")) {
                return new Response(
                    JSON.stringify({ error: "无效的 xrayUrl，缺少 config 参数" }),
                    {
                        status: 400,
                        headers: {
                            "content-type": "application/json; charset=utf-8",
                        },
                    },
                );
            }
        } catch (urlError) {
            return new Response(
                JSON.stringify({ error: "无效的 xrayUrl 格式" }),
                {
                    status: 400,
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 生成短地址ID
        let shortId;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            shortId = generateShortId();
            attempts++;
        } while (await isShortIdExists(kv, shortId) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            return new Response(
                JSON.stringify({ error: "生成短地址失败，请重试" }),
                {
                    status: 500,
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 存储短地址映射到Deno KV
        await kv.set(["shortUrl", shortId], xrayUrl);

        // 生成短地址URL
        const shortUrl = `${url.origin}/s/${shortId}`;

        return new Response(
            JSON.stringify({
                success: true,
                shortUrl: shortUrl,
                shortId: shortId,
                originalUrl: xrayUrl,
                createdAt: new Date().toISOString(),
            }),
            {
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "服务器错误: " + error.message }),
            {
                status: 500,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );
    }
}

// 处理短地址重定向 /s/:shortId
export async function handleShortRedirect(url, kv) {
    const shortId = url.pathname.substring(3); // 移除 "/s/" 前缀

    if (!shortId) {
        return new Response("短地址无效", { 
            status: 404,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }

    try {
        // 从Deno KV查询原始URL
        const result = await kv.get(["shortUrl", shortId]);
        const originalUrl = result.value;

        if (!originalUrl) {
            return new Response("短地址不存在", { 
                status: 404,
                headers: {
                    "content-type": "text/plain; charset=utf-8",
                },
            });
        }

        // 重定向到 combine 接口，保持原有的查询参数
        const combineUrl = new URL("/api/combine", url.origin);
        combineUrl.searchParams.set("xrayUrl", originalUrl);
        
        // 如果原请求有debug参数，也传递过去
        if (url.searchParams.has("debug")) {
            combineUrl.searchParams.set("debug", url.searchParams.get("debug"));
        }

        return Response.redirect(combineUrl.toString(), 302);
    } catch (error) {
        console.error("查询短地址失败:", error);
        return new Response("服务器错误", { 
            status: 500,
            headers: {
                "content-type": "text/plain; charset=utf-8",
            },
        });
    }
}
