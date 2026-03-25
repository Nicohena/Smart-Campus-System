import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-600/30 to-blue-600/30 blur-[120px] rounded-full point-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-10 md:p-16 rounded-[2rem] bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Upgrade</span> Your Campus?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of students and staff members experiencing the future of campus management today.
          </p>

          <div className="flex flex-col sm:flex-row align-center justify-center gap-4">
            <button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:from-purple-500 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] text-lg flex items-center justify-center gap-2 group">
              Login
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
