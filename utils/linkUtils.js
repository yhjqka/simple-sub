import { decodeBase64, base64ToBinary } from './base64.js';

// 判断是否为 HTTP/HTTPS 链接
export function isHttpUrl(str) {
    return /^https?:\/\//.test(str);
}

// 解码URL编码的中文名称
export function decodeChineseName(name) {
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
export function extractDisplayName(link) {
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
export function updateLinkDisplayName(link, newName) {
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

// 获取协议类型
export function getProtocolType(link) {
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

// 生成6位随机字母
export function generateRandomSuffix() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 处理重名问题，生成唯一名称
export function handleDuplicateNames(links) {
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
