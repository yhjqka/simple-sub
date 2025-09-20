// 生成短地址ID
export function generateShortId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 检查短地址ID是否已存在
export async function isShortIdExists(kv, shortId) {
    const result = await kv.get(["shortUrl", shortId]);
    return result.value !== null;
}
