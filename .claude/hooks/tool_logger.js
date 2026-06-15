const fs = require("fs");
const path = require("path");

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());

  const logPath = path.join(__dirname, "../tool_calls.log");
  const entry =
    JSON.stringify({
      ts: new Date().toISOString(),
      tool: toolArgs.tool_name,
      input: toolArgs.tool_input,
    }) + "\n";

  fs.appendFileSync(logPath, entry);
  process.exit(0);
}

main();
