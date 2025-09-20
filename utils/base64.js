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
