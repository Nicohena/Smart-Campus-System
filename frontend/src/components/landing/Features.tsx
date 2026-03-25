import { motion } from "framer-motion";
import { IdCard, CheckCircle, Home, Wrench, Sparkles } from "lucide-react";

const features = [
  {
    title: "Lost ID Replacement",
    description: "Instantly report and request a new student ID card digitally.",
    icon: <IdCard className="w-6 h-6 text-purple-400" />
  },
  {
    title: "Clearance System",
    description: "Automated end-of-semester clearance workflows.",
    icon: <CheckCircle className="w-6 h-6 text-green-400" />
  },
  {
    title: "Dorm Management",
    description: "Room booking, assignments, and dorm inventory tracking.",
    icon: <Home className="w-6 h-6 text-blue-400" />
  },
  {
    title: "Maintenance & Complaints",
    description: "Report issues directly to the facility management team.",
    icon: <Wrench className="w-6 h-6 text-orange-400" />
  },
  {
    title: "AI Campus Assistant",
    description: "Get immediate answers to your campus-related queries using AI.",
    icon: <Sparkles className="w-6 h-6 text-yellow-400" />
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export const Features = () => {
  return (
    <section className="py-24 bg-black px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Services</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Everything you need for a seamless campus experience, accessible from one centralized dashboard.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/50 transition-colors group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-6 border border-white/5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
