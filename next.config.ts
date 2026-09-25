import type { NextConfig } from 'next';

const config: NextConfig = {
  // Typed links: a page that is renamed breaks the build rather than the
  // navigation. Worth it in a console where a dead link is a dead end.
  typedRoutes: true,
};

export default config;
