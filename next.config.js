// GitHub Pages serves a project site under /<repo-name>/. The deploy
// workflow passes that prefix in PAGES_BASE_PATH; local dev uses the root.
const basePath = process.env.PAGES_BASE_PATH || '';

/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  // next/link adds basePath automatically; plain <a> tags read this.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
