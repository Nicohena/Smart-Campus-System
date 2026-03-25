import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "The automated clearance system saved me hours. Everything was approved digitally without lining up.",
    name: "Alex Johnson",
    role: "Senior Student"
  },
  {
    quote: "Reporting maintenance issues is now seamless. The AI assistant categorizes and routes it perfectly.",
    name: "Maria Garcia",
    role: "Dorm President"
  },
  {
    quote: "As a staff member, having all services centralized in one dashboard has streamlined our operations.",
    name: "Robert Smith",
    role: "Campus Administration"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-black px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Feedback</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-sm relative"
            >
              <Quote className="w-10 h-10 text-purple-500/40 absolute top-6 left-6" />
              <p className="text-gray-300 text-lg relative z-10 mt-8 mb-6 italic">
                "{item.quote}"
              </p>
              <div>
                <h4 className="text-white font-bold">{item.name}</h4>
                <p className="text-sm text-purple-400">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
