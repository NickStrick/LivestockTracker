"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import banner from "../../../public/EstanciaImage.jpg";

/**
 * Full-width banner for the top of the landing page. The source is a 3072x1344 image with the
 * wordmark centred near the top and the cow on the right, so on narrow screens we crop to a
 * taller box anchored right of centre to keep both in frame. next/image serves resized copies.
 */
export function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-surface2">
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[16/10] w-full sm:aspect-[2.29/1] lg:aspect-auto lg:h-[34rem]"
      >
        <Image
          src={banner}
          alt="Estancia: a herd of cattle grazing in a mountain valley, with icons for health, weight, location and alerts linked to one cow."
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-[62%_center] sm:object-center"
        />
      </motion.div>
      {/* Fade the bottom edge into the page so the hero below reads as one surface. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}
