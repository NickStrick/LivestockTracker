"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export function FadeIn({ children, delay = 0, className, ...rest }: { delay?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, step = 0.06 }: { children: React.ReactNode; className?: string; step?: number }) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: step } } }} className={className}>
      {children}
    </motion.div>
  );
}

export function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } }} className={className}>
      {children}
    </motion.div>
  );
}

/** Fades/slides in the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}
