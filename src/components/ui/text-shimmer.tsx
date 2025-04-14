import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextShimmerProps {
  text: string;
  className?: string;
}

export const TextShimmer: React.FC<TextShimmerProps> = ({
  text,
  className
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {text}
      </motion.div>
      <motion.div
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{
          duration: 1.5,
          ease: "linear",
          repeat: Infinity,
        }}
      />
    </div>
  );
}; 