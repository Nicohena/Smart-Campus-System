import { Search, Bell, Settings, Sun, Moon, Menu } from "lucide-react";

interface TopbarProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

export function Topbar({ setSidebarOpen }: TopbarProps) {
  return (
    <header className="h-20 flex items-center justify-between px-4 lg:px-8 bg-black/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:flex items-center gap-2 bg-[#121216] border border-white/5 rounded-full px-4 py-2 w-[300px]">
          <Search size={16} className="text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search something..." 
            className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full placeholder:text-zinc-600 focus:ring-0"
          />
          <button className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-1 rounded">Search</button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-black"></span>
        </button>
        <button className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
        <div className="flex items-center gap-1 bg-[#121216] border border-white/5 p-1 rounded-full">
          <button className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
            <Sun size={14} />
          </button>
          <button className="p-1.5 text-white bg-zinc-800 transition-colors rounded-full shadow-sm">
            <Moon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
