import { motion } from "framer-motion";

const staff = [
  {
    name: "Dr. Sarah Jenkins",
    role: "Dean of Students",
    image: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    name: "Michael Chang",
    role: "Head of Housing",
    image: "https://i.pravatar.cc/150?u=michael",
  },
  {
    name: "Emily Rodriguez",
    role: "Facility Manager",
    image: "https://i.pravatar.cc/150?u=emily",
  },
  {
    name: "James Wilson",
    role: "Chief Proctor",
    image: "https://i.pravatar.cc/150?u=james",
  }
];

export const Team = () => {
  return (
    <section className="py-24 bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Administration</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Dedicated professionals working to ensure a safe and productive campus environment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {staff.map((person, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[64px] group-hover:bg-purple-500/20 transition-colors" />
              
              <img
                src={person.image}
                alt={person.name}
                className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-2 border-purple-500/30 p-1"
              />
              <h3 className="text-xl font-bold text-white mb-1">{person.name}</h3>
              <p className="text-purple-400 text-sm font-medium mb-6">{person.role}</p>
              
              <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors">
                Contact
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
