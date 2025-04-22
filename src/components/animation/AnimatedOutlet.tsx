import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavAnimation } from "@/contexts/NavAnimationContext";

export default function AnimatedOutlet() {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const { navBoundingBox, setNavBoundingBox } = useNavAnimation();

  function countSegments(path: string) {
    return path.split("/").filter(Boolean)?.length;
  }

  useEffect(() => {
    const prevSegments = countSegments(prevPath);
    const currSegments = countSegments(location.pathname);

    let newDirection = 1;
    if (prevSegments <= 1) {
      newDirection = 1;
    } else if (currSegments < prevSegments) {
      newDirection = -1;
    } else {
      newDirection = 1;
    }

    setDirection(newDirection);
    setPrevPath(location.pathname);
  }, [location.pathname]);

  // Mobile detection
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Spring transitions with growth effect
  const springTransition = {
    type: "spring",
    stiffness: 150,
    damping: 28,
    mass: 1,
    duration: 3,
  };

  // Animation variants with growing effect using transform scaling
  const desktopVariants = {
    initial: {
      opacity: 0,
      scale: 0.9,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        x: springTransition,
        scale: {
          type: "spring",
          stiffness: 150,
          damping: 28,
          mass: 1,
          duration: 0.2,
        },
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction,
      scale: 0.95,
      transition: {
        x: springTransition,
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      },
    }),
  };

  const settingsVariants = {
    initial: () => ({
      opacity: 0,
      x: 100,
      scale: 0.9, // Start at 90% size
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1, // Grow to full size
      transition: {
        x: springTransition,
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 250, damping: 32 }
      },
    },
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.95,
      transition: {
        x: springTransition,
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      },
    },
  };

  const mobileVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction * 60,
      scale: 0.9, // Start at 90% size
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1, // Grow to full size
      transition: {
        x: springTransition,
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 250, damping: 32 }
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction * -60,
      scale: 0.95,
      transition: {
        x: springTransition,
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      },
    }),
  };

  // Get variants based on current path
  const getVariants = () => {
    if (location.pathname.endsWith("/settings")) {
      return isMobile ? mobileVariants : settingsVariants;
    }
    return isMobile ? mobileVariants : desktopVariants;
  };

  useEffect(() => {
    if (navBoundingBox) {
      const timeout = setTimeout(() => setNavBoundingBox(null), 400);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  return (
    <div className="relative min-h-[60vh]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={getVariants()}
          initial="initial"
          animate="animate"
          style={{
            position: "relative",
            width: "100%",
            transformOrigin: "center top",
            willChange: "transform, opacity",
            display: "block",
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
