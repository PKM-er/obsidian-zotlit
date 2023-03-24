// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Obsidian Zotero",
  // tagline: "Dinosaurs are cool",
  url: "https://obzt.aidenlx.top",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  noIndex: true,
  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  plugins: [
    "@docusaurus/plugin-ideal-image",
    [
      "docusaurus-plugin-typedoc",
      {
        entryPoints: ["../app/obsidian/src/api.ts"],
        tsconfig: "../app/obsidian/tsconfig.json",
        plugin: ["typedoc-plugin-missing-exports"],
        out: "reference/api",
        internalModule: "Internals",
        readme: "none"
      },
    ],
  ],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/aidenlx/obsidian-zotero/edit/master/docs",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Obsidian Zotero",
        logo: {
          alt: "Obsidian Zotero Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            to: "overview",
            position: "left",
            label: "Overview",
          },
          {
            to: "reference",
            position: "left",
            label: "Reference",
          },
          // { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://github.com/aidenlx/obsidian-zotero",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [],
        copyright: [
          `Copyright © ${new Date().getFullYear()} AidenLx. Built with Docusaurus.`,
          `<a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">闽ICP备19020233号-1</a>`,
        ].join(" | "),
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
