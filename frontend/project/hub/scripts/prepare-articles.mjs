import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { prepareArticles } from "./article-content-lib.mjs";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(currentDirectory, "..");

export const main = () => {
  const mode = process.argv[2];
  const result = prepareArticles({
    articlesRoot: path.join(hubRoot, "content", "articles"),
    generatedRoot: path.join(hubRoot, ".generated"),
    mode,
  });
  console.log(
    `Prepared ${result.articleCount} Hub articles and ${result.imageCount} images for ${mode}.`,
  );
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}
