import React, { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface FadeInProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    distance?: number;
}

const FadeIn: React.FC<FadeInProps> = ({
    children,
    delay = 0,
    direction = "up",
    distance = 20,
    ...props
}) => {
    const getDirectionAnimation = () => {
        switch (direction) {
            case "up":
                return { y: distance };
            case "down":
                return { y: -distance };
            case "left":
                return { x: distance };
            case "right":
                return { x: -distance };
            case "none":
                return {};
            default:
                return { y: distance };
        }
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...getDirectionAnimation(),
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0,
            }}
            exit={{
                opacity: 0,
                ...getDirectionAnimation(),
            }}
            transition={{
                duration: 0.3,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default FadeIn; 