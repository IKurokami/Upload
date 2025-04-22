import { useNavAnimation } from "@/contexts/NavAnimationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export const NavBackgroundAnimation = () => {
  const { navBoundingBox } = useNavAnimation();
  const [showAnimation, setShowAnimation] = useState(false);
  const lastValidPosition = useRef(navBoundingBox);
  
  // Update the ref whenever we get a valid bounding box
  useEffect(() => {
    if (navBoundingBox) {
      lastValidPosition.current = navBoundingBox;
    }
  }, [navBoundingBox]);
  
  // Wait a bit after component mounts to start animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get the current position (either the latest or the last valid one)
  const currentPosition = navBoundingBox || lastValidPosition.current;
  
  // Don't render if we don't have any position data yet
  if (!currentPosition) return null;
  
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <AnimatePresence>
        <motion.div
          key="nav-background"
          layoutId="nav-background"
          initial={{
            width: currentPosition.width,
            height: currentPosition.height,
            x: currentPosition.left,
            y: currentPosition.top,
            borderRadius: "0.375rem",
            opacity: showAnimation ? 1 : 0,
          }}
          animate={{
            width: currentPosition.width,
            height: currentPosition.height,
            x: currentPosition.left,
            y: currentPosition.top,
            borderRadius: "0.375rem",
            opacity: 1,
          }}
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.6,
          }}
          className="bg-primary absolute origin-top-left"
        />
      </AnimatePresence>
    </div>
  );
}; 