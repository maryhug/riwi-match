import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "RIWI MATCH Frontend",
  tagline: "Referencia técnica del BFF y la interfaz de Talent Acquisition",
  url: process.env.DOCS_URL ?? "http://localhost",
  baseUrl: process.env.DOCS_BASE_URL ?? "/",
  organizationName: "Riwi",
  projectName: "riwi-match",
  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },
  i18n: {
    defaultLocale: "es",
    locales: ["es"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          path: "../docs",
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/maryhug/riwi-match/edit/main/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "RIWI MATCH · Frontend",
      items: [
        { to: "/", label: "Documentación", position: "left" },
        {
          href: "https://github.com/maryhug/riwi-match",
          label: "Código",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Referencia",
          items: [
            { label: "Arquitectura", to: "/architecture" },
            { label: "Contratos", to: "/data-and-contracts" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RIWI MATCH.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
