import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import type { AccessLogLine } from "../types";

export async function* streamAccessLogLines(
  filePaths: string[],
): AsyncGenerator<AccessLogLine> {
  for (const filePath of filePaths) {
    const file = path.basename(filePath);
    const stream = createReadStream(filePath, { encoding: "utf8" });
    const readLineFromStream = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let lineNumber = 0;
    try {
      for await (const line of readLineFromStream) {
        lineNumber += 1;
        yield { line, file, lineNumber };
      }
    } finally {
      readLineFromStream.close();
      stream.destroy();
    }
  }
}
