import { useState } from "react"
import { Shield, Key, Mail, ArrowRight } from "lucide-react"

export function Login() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const handleLogin = () => {
    console.log({ email, password })
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Subtle background glow similar to image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="bg-[#09090b] border border-white/5 shadow-2xl rounded-2xl p-8 w-[400px] max-w-[90vw] z-10">
        <div className="flex flex-col mb-8">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
            <Shield className="w-5 h-5 text-purple-500" fill="currentColor" />
          </div>
          
          <h1 className="text-[26px] font-semibold text-white tracking-tight leading-tight">
            Login to Your <br/> Account
          </h1>
          <p className="text-zinc-500 text-sm mt-3">
            Access your secure campus workspace.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="campus_id@uni.edu"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-full bg-[#141415] border border-white/5 rounded-lg py-3.5 pl-11 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full bg-[#141415] border border-white/5 rounded-lg py-3.5 pl-11 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all tracking-widest"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogin}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
            >
              Log In <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* 3 dots */}
        <div className="flex justify-center gap-1.5 mt-10 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
        </div>
      </div>

      <div className="mt-8 text-zinc-600 text-[11px] uppercase tracking-wider font-semibold z-10">
        &copy; {new Date().getFullYear()} Campus System. All rights reserved.
      </div>
    </div>
  )
}
