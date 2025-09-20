import { decodeBase64 } from '../utils/base64.js';

export class SubscribeParser {
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

export async function loadSubscribe(url) {
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
