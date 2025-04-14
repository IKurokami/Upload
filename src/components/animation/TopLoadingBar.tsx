import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TopLoadingBarProps {
  progress: number;
  isLoading: boolean;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({
  progress,
  isLoading,
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="top-loading-bar rainbow-bar"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "2px",
            width: "100vw",
            zIndex: 9999,
            transformOrigin: "left",
            pointerEvents: "none",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          exit={{ scaleX: 0 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
          }}
        />
      )}
    </AnimatePresence>
  );
};
