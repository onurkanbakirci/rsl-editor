"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { HeaderSection } from "@/components/shared/header-section";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

const rslFeatures = [
    {
        title: "Create RSL of your website",
        description:
            "Generate comprehensive RSL documents for your website content with our intuitive editor. Define licensing terms, permissions, and usage rights in minutes.",
        image: "/_static/use-cases/use-case-1.png",
        icon: "plus",
        link: "/dashboard",
        features: [
            "Visual RSL builder",
            "Multiple licensing templates",
            "Real-time validation",
            "Export in multiple formats"
        ]
    },
    {
        title: "Store your all RSLs in a single place",
        description:
            "Centralize all your RSL documents in one secure dashboard. Organize, manage, and track your content licensing across multiple websites and projects.",
        image: "/_static/use-cases/use-case-2.png",
        icon: "database",
        link: "/dashboard",
        features: [
            "Centralized dashboard",
            "Project organization",
            "Version history",
            "Bulk operations"
        ]
    },
    {
        title: "Validate your already created RSLs",
        description:
            "Ensure your existing RSL documents comply with the latest standards. Our validator checks syntax, structure, and best practices automatically.",
        image: "/_static/use-cases/use-case-3.png",
        icon: "shield",
        link: "/dashboard/validator",
        features: [
            "Comprehensive validation",
            "Error reporting",
            "Best practice suggestions",
            "Compliance checking"
        ]
    }
];

export default function RSLFeatures() {
    return (
        <section id="rsl-features" className="py-16 sm:py-24">
            <MaxWidthWrapper>
                <HeaderSection
                    label="Features"
                    title="Powerful RSL Management Tools"
                    subtitle="Everything you need to create, manage, and validate RSL documents for your content licensing needs."
                />

                <div className="mt-16 space-y-20">
                    {rslFeatures.map((feature, index) => {
                        const Icon = Icons[feature.icon as keyof typeof Icons] || Icons.add;
                        const isReverse = index % 2 === 1;

                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className={cn(
                                    "grid gap-8 lg:grid-cols-2 lg:gap-16 items-center",
                                    isReverse && "lg:grid-flow-col-dense"
                                )}
                            >
                                {/* Content */}
                                <motion.div 
                                    className={cn("space-y-6", isReverse && "lg:col-start-2")}
                                    initial={{ opacity: 0, x: isReverse ? 50 : -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                >
                                    <motion.div 
                                        className="flex items-center gap-3"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                    >
                                        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                                            <Icon className="size-6 text-rsl-purple" />
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                    </motion.div>

                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                            {feature.title}
                                        </h3>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>

                                    <ul className="space-y-3">
                                        {feature.features.map((item, itemIndex) => (
                                            <motion.li 
                                                key={itemIndex} 
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.4, delay: 0.6 + itemIndex * 0.1 }}
                                            >
                                                <div className="flex size-5 items-center justify-center rounded-full bg-rsl-purple/10">
                                                    <Icons.check className="size-3 text-rsl-purple" />
                                                </div>
                                                <span className="text-sm font-medium">{item}</span>
                                            </motion.li>
                                        ))}
                                    </ul>

                                    <motion.div 
                                        className="pt-4"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                                    >
                                        <Link
                                            href={feature.link}
                                            className={cn(
                                                buttonVariants({ size: "lg", rounded: "full" }),
                                                "bg-rsl-orange text-white hover:bg-rsl-orange/90"
                                            )}
                                        >
                                            Try it now
                                            <Icons.arrowRight className="ml-2 size-4" />
                                        </Link>
                                    </motion.div>
                                </motion.div>

                                {/* Image */}
                                <motion.div 
                                    className={cn("relative", isReverse && "lg:col-start-1")}
                                    initial={{ opacity: 0, x: isReverse ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                >
                                    <motion.div 
                                        className="relative overflow-hidden rounded-2xl border bg-background p-2 shadow-xl"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="aspect-[4/3] overflow-hidden rounded-xl">
                                            <Image
                                                src={feature.image}
                                                alt={feature.title}
                                                width={600}
                                                height={400}
                                                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                                                priority={index === 0}
                                            />
                                        </div>

                                        {/* Overlay gradient for better text readability on hover */}
                                        <div className="absolute inset-2 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                                    </motion.div>

                                    {/* Decorative elements */}
                                    <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-rsl-purple/10 to-rsl-magenta/10 blur-3xl" />
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </MaxWidthWrapper>
        </section>
    );
}
