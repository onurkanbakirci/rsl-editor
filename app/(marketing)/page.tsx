"use client";

import { motion } from "framer-motion";
import { infos } from "@/config/landing";
import BentoGrid from "@/components/sections/bentogrid";
import Features from "@/components/sections/features";
import HeroLanding from "@/components/sections/hero-landing";
import InfoLanding from "@/components/sections/info-landing";
import Powered from "@/components/sections/powered";
import PreviewLanding from "@/components/sections/preview-landing";
import RSLFeatures from "@/components/sections/rsl-features";
import Testimonials from "@/components/sections/testimonials";

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function IndexPage() {
  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUpVariants}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <HeroLanding />
      </motion.div>
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUpVariants}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <PreviewLanding />
      </motion.div>
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUpVariants}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <RSLFeatures />
      </motion.div>
      
      {/* <Powered /> */}
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUpVariants}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <BentoGrid />
      </motion.div>
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUpVariants}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <InfoLanding data={infos[0]} reverse={true} />
      </motion.div>
      
      {/* <InfoLanding data={infos[1]} /> */}
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUpVariants}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Features />
      </motion.div>
      
      {/* <Testimonials /> */}
    </>
  );
}
