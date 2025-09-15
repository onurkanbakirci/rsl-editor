import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "RSL",
  description:
    "The open content licensing standard for the AI-first Internet. Really Simple Licensing makes it easy to manage content rights and permissions.",
  url: site_url,
  ogImage: `${site_url}/_static/og.png`,
  links: {
    twitter: "https://twitter.com/onurkanbakirci",
    github: "https://github.com/onurkanbakirci/rsl-editor",
  },
  mailSupport: "support@rsl.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "#" },
      { title: "Enterprise", href: "#" },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "Product",
    items: [
      { title: "RSL Guide", href: "/docs" },
      { title: "RSL Reference", href: "/docs" },
      { title: "RSL API", href: "/docs" },
      { title: "Quickstart", href: "/docs" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Documentation", href: "/docs" },
      { title: "Getting Started", href: "/docs" },
      { title: "Licensing Guide", href: "#" },
      { title: "Examples", href: "#" },
    ],
  },
];
