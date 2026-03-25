import { motion } from "framer-motion";

const stats = [
  { label: "Total Students", value: "12,500+" },
  { label: "Total Dorms", value: "48" },
  { label: "Issues Resolved", value: "98.5%" },
  { label: "AI Predictions", value: "1.2M" }
];

export const Stats = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-black to-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-6 text-center rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg relative overflow-hidden group"
            >
              {/* Animated glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-20 blur transition-opacity duration-500" />
              
              <div className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-purple-300 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
