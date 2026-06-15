async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());

  const command = toolArgs.tool_input?.command || "";

  if (/rm\s+(-\w*r\w*f\w*|-\w*f\w*r\w*)\s/i.test(command) || /rm\s+(-\w*r\w*f\w*|-\w*f\w*r\w*)$/.test(command)) {
    console.error("Blocked: rm -rf commands are not allowed.");
    process.exit(2);
  }

  process.exit(0);
}

main();
