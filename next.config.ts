import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";
import { siteBasePath } from "./src/content/site-path";
const config: NextConfig = {
  basePath: siteBasePath,
  env: {
    NEXT_PUBLIC_BUILD_REVISION: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
  },
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};
export default config;
