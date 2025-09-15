import { FeatureLdg, InfoLdg, TestimonialType } from "types";

export const infos: InfoLdg[] = [
  {
    title: "Open Content Licensing",
    description:
      "RSL provides a standardized, open approach to content licensing for the AI-first Internet. Define clear usage rights and permissions for your digital content.",
    image: "/_static/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Standardized Format",
        description: "Use a consistent, machine-readable format for all content licensing.",
        icon: "file",
      },
      {
        title: "AI-Ready",
        description: "Purpose-built for AI training and content consumption use cases.",
        icon: "settings",
      },
      {
        title: "Open Standard",
        description:
          "Built as an open standard that anyone can implement and use freely.",
        icon: "shield",
      },
    ],
  },
  {
    title: "Simple Implementation",
    description:
      "Implement RSL licensing with minimal effort. The specification is designed to be simple, clear, and easy to adopt across any platform or content management system.",
    image: "/_static/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Easy Integration",
        description:
          "Integrate RSL into existing systems with simple markup and metadata.",
        icon: "laptop",
      },
      {
        title: "Clear Documentation",
        description: "Comprehensive guides and examples for quick implementation.",
        icon: "bookOpen",
      },
      {
        title: "Flexible Licensing",
        description:
          "Support for various licensing models from open to restrictive use cases.",
        icon: "arrowRight",
      },
    ],
  },
];

export const features: FeatureLdg[] = [
  {
    title: "RSL Guide",
    description:
      "Comprehensive guide to understanding and implementing Really Simple Licensing.",
    link: "/docs",
    icon: "bookOpen",
  },
  {
    title: "RSL Reference",
    description:
      "Complete technical reference for all RSL specification elements and attributes.",
    link: "/docs",
    icon: "file",
  },
  {
    title: "RSL API",
    description:
      "RESTful API for programmatic access to RSL validation and processing tools.",
    link: "/docs",
    icon: "settings",
  },
  {
    title: "Licensing Templates",
    description:
      "Pre-built licensing templates for common use cases and content types.",
    link: "/docs",
    icon: "copy",
  },
  {
    title: "Validation Tools",
    description:
      "Online tools to validate and verify your RSL implementations.",
    link: "/dashboard",
    icon: "shield",
  },
  {
    title: "Community Support",
    description:
      "Join the RSL community for support, examples, and best practices.",
    link: "/docs",
    icon: "user",
  },
];

export const testimonials: TestimonialType[] = [
  {
    name: "Dr. Emily Chen",
    job: "AI Research Director",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    review:
      "RSL has revolutionized how we handle content licensing for AI training. The standardized format makes it easy to respect content creators' rights while building responsible AI systems.",
  },
  {
    name: "Marcus Rodriguez",
    job: "Content Platform CEO",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    review:
      "Implementing RSL across our platform was straightforward and has given our creators clear control over how their content is used. It's exactly what the industry needed.",
  },
  {
    name: "Jennifer Kim",
    job: "Digital Rights Manager",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    review:
      "RSL's simplicity is its strength. We can now express complex licensing terms in a way that both humans and machines can understand and respect.",
  },
  {
    name: "David Thompson",
    job: "Open Source Advocate",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    review:
      "As an open standard, RSL represents the best of collaborative development. It's licensing for the modern, AI-first internet we're building together.",
  },
  {
    name: "Lisa Wang",
    job: "Publisher CTO",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    review:
      "RSL integrates perfectly with our existing content management systems. The clear documentation and examples made implementation painless.",
  },
  {
    name: "Alex Johnson",
    job: "Legal Tech Specialist",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    review:
      "From a legal perspective, RSL provides the clarity and precision we need for content licensing in the digital age. It's a game-changer for rights management.",
  },
];
