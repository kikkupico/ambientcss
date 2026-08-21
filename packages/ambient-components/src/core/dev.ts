declare const process: { env: Record<string, string | undefined> };

/** True outside a production build.
 *
 *  Written as a bare `process.env.NODE_ENV` comparison so bundlers replace
 *  it textually and drop the guarded code from production output, and
 *  wrapped in try/catch so an unbundled ESM consumer — a CDN import with no
 *  `process` shim — gets `false` rather than a ReferenceError. */
export const isDev: boolean = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();
