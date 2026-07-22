/* Vite resolves an asset import to its emitted URL. Only the one type the
   demo actually imports is declared, rather than pulling in all of
   vite/client's globals. */
declare module "*.mp4" {
  const src: string;
  export default src;
}
