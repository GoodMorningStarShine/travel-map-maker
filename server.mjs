import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { readFile, watch } from "node:fs/promises";

const root = resolve("src");
const isProduction = process.argv.includes("--production");
const port = Number(process.env.PORT || 5173);
const reloadClients = new Set();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

if (!isProduction) {
  void watchForChanges();
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (!isProduction && url.pathname === "/__reload") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write("\n");
    reloadClients.add(response);
    request.on("close", () => reloadClients.delete(response));
    return;
  }

  const filePath = getFilePath(url.pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
    response.end(contents);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Travel Map Maker running at http://localhost:${port}`);
});

function getFilePath(pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(root, decodeURIComponent(requestedPath)));
  return filePath.startsWith(root) ? filePath : null;
}

async function watchForChanges() {
  try {
    const watcher = watch(root, { recursive: true });
    for await (const event of watcher) {
      if (!event.filename) continue;
      for (const client of reloadClients) {
        client.write("event: reload\ndata: changed\n\n");
      }
    }
  } catch (error) {
    console.warn("Hot reload is unavailable:", error.message);
  }
}
