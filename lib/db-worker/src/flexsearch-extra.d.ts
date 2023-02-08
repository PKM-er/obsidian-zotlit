/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/naming-convention */

declare module "flexsearch/src/document" {
  export default (await import("flexsearch")).Document;
}

declare module "flexsearch/src/lang/en.js" {
  const lang: import("flexsearch").LanguageOptions;
  export default lang;
}
declare module "flexsearch/src/lang/latin/default.js" {
  const charset: import("flexsearch").CharsetOptions;
  export default charset;
}
