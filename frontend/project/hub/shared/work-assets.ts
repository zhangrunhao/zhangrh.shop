const workAssets: Record<string, string> = import.meta.glob<string>(
  "../assets/works/**/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

export const resolveWorkAsset = (relativePath: string) => {
  const segments = relativePath.split("/");
  const isCanonicalWorkPath =
    relativePath.startsWith("works/") &&
    !relativePath.startsWith("/") &&
    !relativePath.includes("\\") &&
    segments.length > 1 &&
    segments.every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

  if (!isCanonicalWorkPath) {
    throw new Error(`Invalid work asset path: ${relativePath}`);
  }

  const assetKey = `../assets/${relativePath}`;
  const assetUrl = workAssets[assetKey];

  if (!assetUrl) {
    throw new Error(`Work asset not found: ${relativePath}`);
  }

  return assetUrl;
};
