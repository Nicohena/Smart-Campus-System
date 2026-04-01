import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Key, Hash, ArrowRight, Loader2 } from "lucide-react"
import { authApi } from "../api/auth"

export function Login() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const handleLogin = async () => {
    setError("")

    if (!studentId || !password) {
      setError("Please enter your ID and password.")
      return
    }

    setLoading(true)
    try {
      const data = await authApi.login(studentId, password)

      // Store token and user info
      localStorage.setItem("token", data.data.token)
      localStorage.setItem("user", JSON.stringify(data.data.user))

      // Redirect to dashboard (or home for now)
      navigate("/")
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-[#09090b] border border-white/5 shadow-2xl rounded-2xl p-8 w-[400px] max-w-[90vw] z-10 animate-border-glow">
        <div className="flex flex-col mb-8">
          <br></br>

          <h1 className="text-[26px] font-semibold text-white tracking-tight leading-tight">
            Login to Your <br /> Account
          </h1>
          <p className="text-zinc-500 text-sm mt-3">
            Access your secure campus workspace.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Student ID field */}
          <div>
            <label className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
             ID
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="DBU1111111"
                value={studentId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentId(e.target.value)}
                className="w-full bg-[#141415] border border-white/5 rounded-lg py-3.5 pl-11 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="•••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#141415] border border-white/5 rounded-lg py-3.5 pl-11 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all tracking-widest"
              />
            </div>
          </div>

          <div className="mt-16">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                </>
              ) : (
                <>
                  Log In <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>


      
      </div>

      <div className="mt-8 text-zinc-600 text-[11px] uppercase tracking-wider font-semibold z-10">
        &copy; {new Date().getFullYear()} Campus System. All rights reserved.
      </div>
    </div>
  )
}
