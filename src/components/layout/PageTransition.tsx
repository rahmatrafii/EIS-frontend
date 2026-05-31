"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col flex-1 h-full min-h-[inherit] w-full", className)}
    >
      {children}
    </motion.div>
  );
}

