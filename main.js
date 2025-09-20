import {
  handleCombineApi,
  handleShortenApi,
  handleShortRedirect,
} from "./api/handlers.js";

// 初始化Deno KV
const kv = await Deno.openKv();

const STATIC_DIR = "./public/";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // 处理根路径，返回 index.html
  if (pathname === "/") {
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
  if (pathname === "/api/combine") {
    return await handleCombineApi(req, url);
  }

  // 处理 /api/shorten 接口
  if (pathname === "/api/shorten") {
    return await handleShortenApi(req, url, kv);
  }

  // 处理短地址重定向 /s/:shortId
  if (pathname.startsWith("/s/")) {
    return await handleShortRedirect(url, kv);
  }

  // 处理静态资源请求，如 .html, .js, .css 等
  const resourcePath = `${STATIC_DIR}${pathname}`;
  try {
    const file = await Deno.readFile(resourcePath);
    const ext = pathname.split(".").pop();

    let contentType = "text/plain";
    if (ext === "html") contentType = "text/html; charset=utf-8";
    if (ext === "js") contentType = "application/javascript; charset=utf-8";
    if (ext === "css") contentType = "text/css; charset=utf-8";
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    if (ext === "png") contentType = "image/png";

    return new Response(file, {
      headers: {
        "content-type": contentType,
      },
    });
  } catch (e) {
    return new Response("资源未找到", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }
});
