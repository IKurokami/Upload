import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function AnimatedOutlet() {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  function countSegments(path: string) {
    return path.split("/").filter(Boolean).length;
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

  // Animation variants
  const desktopVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      width: "100%",
    }),
    animate: {
      x: 0,
      opacity: 1,
      width: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      width: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    }),
  };

  const mobileVariants = {
    initial: {
      x: 0,
      opacity: 0,
      width: "100%",
    },
    animate: {
      x: 0,
      opacity: 1,
      width: "100%",
      transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: {
      x: 0,
      opacity: 0,
      width: "100%",
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  return (
    <div style={{ position: "relative", minHeight: "60vh" }}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={isMobile ? mobileVariants : desktopVariants}
          initial="initial"
          animate="animate"
          style={{
            position: "absolute",
            width: "100%",
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
