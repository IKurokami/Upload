import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavAnimation } from "@/contexts/NavAnimationContext";

export default function AnimatedOutlet() {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const { navBoundingBox, setNavBoundingBox } = useNavAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate scale and translate for initial animation
  function getInitialTransform() {
    if (navBoundingBox && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      // Fallback min size if container is too small
      const minWidth = 800;
      const minHeight = 400;
      const containerWidth = containerRect.width < 50 ? minWidth : containerRect.width;
      const containerHeight = containerRect.height < 50 ? minHeight : containerRect.height;
      const scaleX = navBoundingBox.width / containerWidth;
      const scaleY = navBoundingBox.height / containerHeight;
      const translateX = navBoundingBox.left + navBoundingBox.width / 2 - (containerRect.left + containerWidth / 2);
      const translateY = navBoundingBox.top + navBoundingBox.height / 2 - (containerRect.top + containerHeight / 2);
      return {
        scaleX,
        scaleY,
        translateX,
        translateY,
      };
    }
    return null;
  }

  // Animation variants
  const desktopVariants = {
    initial: () => {
      const t = getInitialTransform();
      if (t) {
        return {
          opacity: 0,
          scaleX: t.scaleX,
          scaleY: t.scaleY,
          x: t.translateX,
          y: t.translateY,
        };
      }
      return {
        opacity: 0,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 300,
      };
    },
    animate: {
      y: 0,
      x: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 0.7,
      },
    },
    exit: {
      y: -150,
      scale: 0.98,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 0.1,
      },
    },
  };

  const settingsVariants = {
    initial: () => {
      const t = getInitialTransform();
      if (t) {
        return {
          opacity: 0,
          scaleX: t.scaleX,
          scaleY: t.scaleY,
          x: t.translateX,
          y: t.translateY,
        };
      }
      return {
        opacity: 0,
        x: 1000,
        scaleX: 0.5,
        scaleY: 0.5,
        y: 0,
      };
    },
    animate: {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 0.7,
      },
    },
    exit: {
      x: -100,
      y: 0,
      scaleX: 0.98,
      scaleY: 0.98,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 0.1,
      },
    },
  };

  const mobileVariants = {
    initial: () => {
      const t = getInitialTransform();
      if (t) {
        return {
          opacity: 0,
          scaleX: t.scaleX,
          scaleY: t.scaleY,
          x: t.translateX,
          y: t.translateY,
        };
      }
      return {
        opacity: 0,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
      };
    },
    animate: {
      y: 0,
      x: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 28,
        mass: 1,
        duration: 0.7,
      },
    },
    exit: {
      y: -20,
      scale: 0.96,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 28,
        mass: 1,
        duration: 0.1,
      },
    },
  };

  // Get variants based on current path
  const getVariants = () => {
    if (location.pathname.endsWith("/settings")) {
      return isMobile ? mobileVariants : settingsVariants;
    }
    return isMobile ? mobileVariants : desktopVariants;
  };

  // Reset navBoundingBox after animation starts
  useEffect(() => {
    if (navBoundingBox) {
      const timeout = setTimeout(() => setNavBoundingBox(null), 400);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} style={{ position: "relative", minHeight: "60vh" }}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={getVariants()}
          initial="initial"
          animate="animate"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            transformOrigin: "center center",
            willChange: "transform, opacity",
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
