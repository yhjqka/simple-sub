// Base64 解码函数
export function decodeBase64(input) {
    const binaryString = base64ToBinary(input);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

// 将 Base64 转换为二进制字符串（解码）
export function base64ToBinary(base64String) {
    const base64Chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let binaryString = "";
    base64String = base64String.replace(/=+$/, ""); // 去掉末尾的 '='

    for (let i = 0; i < base64String.length; i += 4) {
        const bytes = [
            base64Chars.indexOf(base64String[i]),
            base64Chars.indexOf(base64String[i + 1]),
            base64Chars.indexOf(base64String[i + 2]),
            base64Chars.indexOf(base64String[i + 3]),
        ];
        const byte1 = (bytes[0] << 2) | (bytes[1] >> 4);
        const byte2 = ((bytes[1] & 15) << 4) | (bytes[2] >> 2);
        const byte3 = ((bytes[2] & 3) << 6) | bytes[3];

        if (bytes[1] !== -1) binaryString += String.fromCharCode(byte1);
        if (bytes[2] !== -1) binaryString += String.fromCharCode(byte2);
        if (bytes[3] !== -1) binaryString += String.fromCharCode(byte3);
    }

    return binaryString;
}


async function loadSubscribe(url) {
    try {
        const resp = await fetch(url, {
            headers: {
                "user-agent": "v2rayN/7.14.9",
            },
        });

        const list = SubscribeParser.parse(await resp.text());
        return list;
    } catch (error) {
        console.error("加载订阅失败:", error);
        return [];
    }
}

// 判断是否为 HTTP/HTTPS 链接
function isHttpUrl(str) {
    return /^https?:\/\//.test(str);
}

// 解码URL编码的中文名称
function decodeChineseName(name) {
    try {
        // 检查是否包含URL编码的字符
        if (name.includes('%')) {
            return decodeURIComponent(name);
        }
        return name;
    } catch (error) {
        // 如果解码失败，返回原始名称
        return name;
    }
}

// 从各种协议链接中提取显示名称
function extractDisplayName(link) {
    try {
        // 检查是否是 Hysteria2 链接
        if (link.startsWith("hysteria2://")) {
            const url = new URL(link);
            const fragment = url.hash.substring(1);
            if (fragment) {
                // 移除 [Hy2] 前缀
                return fragment.replace(/^\[Hy2\]/, "");
            }
            return `Hy2-${url.hostname}`;
        }

        // 检查是否是 VMess 链接
        if (link.startsWith("vmess://")) {
            try {
                const decoded = decodeBase64(link.substring(8));
                const config = JSON.parse(decoded);
                return config.ps || `VMess-${config.add || "unknown"}`;
            } catch (e) {
                return "VMess-unknown";
            }
        }

        // 检查是否是 VLESS 链接
        if (link.startsWith("vless://")) {
            const url = new URL(link);
            const fragment = url.hash.substring(1);
            return fragment || `VLESS-${url.hostname}`;
        }

        // 检查是否是 Trojan 链接
        if (link.startsWith("trojan://")) {
            const url = new URL(link);
            const fragment = url.hash.substring(1);
            return fragment || `Trojan-${url.hostname}`;
        }

        // 检查是否是 Shadowsocks 链接
        if (link.startsWith("ss://")) {
            const url = new URL(link);
            const fragment = url.hash.substring(1);
            return fragment || `SS-${url.hostname}`;
        }

        // 检查是否是 ShadowsocksR 链接
        if (link.startsWith("ssr://")) {
            try {
                const decoded = decodeBase64(link.substring(6));
                const parts = decoded.split("/");
                if (parts.length > 1) {
                    const params = new URLSearchParams(parts[1]);
                    return params.get("remarks") ||
                        `SSR-${parts[0].split(":")[0]}`;
                }
                return `SSR-${parts[0].split(":")[0]}`;
            } catch (e) {
                return "SSR-unknown";
            }
        }

        // 默认返回协议和主机名
        if (link.includes("://")) {
            const url = new URL(link);
            return `${url.protocol.replace(":", "")}-${url.hostname}`;
        }

        return "Unknown";
    } catch (error) {
        return "ParseError";
    }
}

// 修改链接中的显示名称
function updateLinkDisplayName(link, newName) {
    try {
        // 检查是否是 Hysteria2 链接
        if (link.startsWith("hysteria2://")) {
            const url = new URL(link);
            url.hash = `#${newName}`;
            return url.toString();
        }

        // 检查是否是 VLESS 链接
        if (link.startsWith("vless://")) {
            const url = new URL(link);
            url.hash = `#${newName}`;
            return url.toString();
        }

        // 检查是否是 Trojan 链接
        if (link.startsWith("trojan://")) {
            const url = new URL(link);
            url.hash = `#${newName}`;
            return url.toString();
        }

        // 检查是否是 Shadowsocks 链接
        if (link.startsWith("ss://")) {
            const url = new URL(link);
            url.hash = `#${newName}`;
            return url.toString();
        }

        // 检查是否是 VMess 链接
        if (link.startsWith("vmess://")) {
            try {
                const decoded = decodeBase64(link.substring(8));
                const config = JSON.parse(decoded);
                config.ps = newName;
                const encoded = base64ToBinary(JSON.stringify(config));
                return `vmess://${encoded}`;
            } catch (e) {
                return link; // 如果解析失败，返回原链接
            }
        }

        // 检查是否是 ShadowsocksR 链接
        if (link.startsWith("ssr://")) {
            try {
                const decoded = decodeBase64(link.substring(6));
                const parts = decoded.split("/");
                if (parts.length > 1) {
                    const params = new URLSearchParams(parts[1]);
                    params.set("remarks", newName);
                    const newDecoded = `${parts[0]}/${params.toString()}`;
                    const encoded = base64ToBinary(newDecoded);
                    return `ssr://${encoded}`;
                }
                return link;
            } catch (e) {
                return link; // 如果解析失败，返回原链接
            }
        }

        return link; // 其他协议返回原链接
    } catch (error) {
        return link; // 出错时返回原链接
    }
}

// 生成6位随机字母
function generateRandomSuffix() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 处理重名问题，生成唯一名称
function handleDuplicateNames(links) {
    const nameCount = new Map();
    const result = [];
    let hasDuplicates = false;

    // 第一遍扫描，统计解码后名称的出现次数
    for (const link of links) {
        const rawName = extractDisplayName(link);
        const decodedName = decodeChineseName(rawName); // 统一解码后再比较
        nameCount.set(decodedName, (nameCount.get(decodedName) || 0) + 1);
    }

    // 检查是否有重名
    for (const count of nameCount.values()) {
        if (count > 1) {
            hasDuplicates = true;
            break;
        }
    }

    // 第二遍扫描，处理重名
    const usedNames = new Map();

    for (const link of links) {
        const rawName = extractDisplayName(link);
        const decodedName = decodeChineseName(rawName); // 统一解码
        let finalName = decodedName;
        let modifiedLink = link;
        let isDuplicate = false;

        if (nameCount.get(decodedName) > 1) {
            // 如果有重名，需要添加后缀
            isDuplicate = true;
            if (!usedNames.has(decodedName)) {
                usedNames.set(decodedName, 0);
            }
            usedNames.set(decodedName, usedNames.get(decodedName) + 1);
            const randomSuffix = generateRandomSuffix();
            finalName = `${decodedName}(${randomSuffix})`;

            // 修改原始链接中的显示名称为解码后的新名称
            modifiedLink = updateLinkDisplayName(link, finalName);
        } else {
            // 如果没有重名，但原始名称是编码的，也需要更新为解码后的名称
            if (rawName !== decodedName) {
                modifiedLink = updateLinkDisplayName(link, decodedName);
            }
        }

        result.push({
            original: modifiedLink,
            displayName: finalName,
            protocol: getProtocolType(link),
            isDuplicate: isDuplicate,
        });
    }

    return {
        links: result,
        hasDuplicates: hasDuplicates
    };
}

// 获取协议类型
function getProtocolType(link) {
    if (link.startsWith("hysteria2://")) return "Hysteria2";
    if (link.startsWith("vmess://")) return "VMess";
    if (link.startsWith("vless://")) return "VLESS";
    if (link.startsWith("trojan://")) return "Trojan";
    if (link.startsWith("ss://")) return "Shadowsocks";
    if (link.startsWith("ssr://")) return "ShadowsocksR";
    if (link.startsWith("http://") || link.startsWith("https://")) {
        return "HTTP";
    }
    return "Unknown";
}

// 解析 generateXrayUrl 生成的结果
async function parseXrayUrlResult(xrayUrl) {
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

// 初始化Deno KV
const kv = await Deno.openKv();

// 生成短地址ID
function generateShortId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 检查短地址ID是否已存在
async function isShortIdExists(shortId) {
    const result = await kv.get(["shortUrl", shortId]);
    return result.value !== null;
}

Deno.serve(async (req) => {
    const url = new URL(req.url);

    // 处理根路径，返回 index.html
    if (url.pathname === "/") {
        try {
            const htmlContent = await Deno.readTextFile("./index.html");
            return new Response(htmlContent, {
                headers: {
                    "content-type": "text/html; charset=utf-8",
                },
            });
        } catch (error) {
            return new Response("页面未找到", { status: 404 });
        }
    }

    // 处理 /api/combine 接口
    if (url.pathname === "/api/combine") {
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
    if (url.pathname === "/api/shorten") {
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
            } while (await isShortIdExists(shortId) && attempts < maxAttempts);

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
    if (url.pathname.startsWith("/s/")) {
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

    return new Response("接口未找到", { 
        status: 404,
        headers: {
            "content-type": "text/plain; charset=utf-8",
        },
    });
});

class SubscribeParser {
    static parse(text) {
        let decodedText;

        try {
            decodedText = decodeBase64(text.trim());
            // Check if the decoded text needs URL decoding
            if (decodedText.includes("%")) {
                decodedText = decodeURIComponent(decodedText);
            }
        } catch (e) {
            decodedText = text;
            // Check if the original text needs URL decoding
            if (decodedText.includes("%")) {
                try {
                    decodedText = decodeURIComponent(decodedText);
                } catch (urlError) {
                    console.warn("Failed to URL decode the text:", urlError);
                }
            }
        }
        return decodedText.split("\n").filter((line) => line.trim() !== "");
    }
}
