import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

/** Plain terminal prompt. */
export async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Prompt with hidden input (nothing echoed), for passwords. */
export function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\n" || char === "\r") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "") process.exit(130); // Ctrl+C
        if (char === "" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
