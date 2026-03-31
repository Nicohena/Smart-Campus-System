import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Plasma from './Plasma';
import SplitText from './SplitText';

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-6 lg:px-8">
      {/* Plasma Background Container */}
      <div className="plasma-container">
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Plasma 
            color="#9155ce"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={false}
          />
        </div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          
          <SplitText
            text="Welcome to Campus System"
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-sm font-sans"
            delay={50}
            duration={1.25}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            tag="h1"
            onLetterAnimationComplete={() => {}}
          />
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Centralize all student services in one intelligent, responsive platform. Stay connected, report issues, and manage your campus life effortlessly.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Enter Student ID" 
              className="w-full sm:w-80 px-6 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 group">
            Login
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
