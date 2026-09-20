"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import banner from "../../../public/EstanciaImage.jpg";
import { useI18n } from "@/lib/i18n/client";

/**
 * Top-of-page banner. The image is shown whole at its own aspect ratio (no cropping, no
 * overlays), because the wordmark is part of the picture. It sits edge to edge on phones and
 * as a rounded card in the page grid from `sm` up, so it never grows taller than the layout.
 */
export function HeroBanner() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl sm:px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="overflow-hidden bg-surface2 sm:rounded-3xl sm:border sm:border-line sm:shadow-xl sm:shadow-black/10">
        <Image
          src={banner}
          alt={t("Estancia: a herd of cattle grazing in a mountain valley, with icons for health, weight, location and alerts linked to one cow.")}
          priority
          placeholder="blur"
          sizes="(min-width: 1280px) 1232px, 100vw"
          className="block h-auto w-full"
        />
      </motion.div>
    </div>
  );
}
