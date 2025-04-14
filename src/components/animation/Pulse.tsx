import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface PulseProps {
    children: ReactNode;
}

const Pulse: React.FC<PulseProps> = ({ children }) => {
    return (
        <motion.div
            animate={{
                scale: [1, 1.02, 1],
                opacity: [0.8, 1, 0.8],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {children}
        </motion.div>
    );
};

export default Pulse; 