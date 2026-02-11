"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, Loader2, CalendarDays, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- EFECTO DE PARTÍCULAS (ESTRELLAS) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];
    const particleCount = 80;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number;
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }
      draw() {
        ctx!.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    init();
    animate();
    return () => window.removeEventListener("resize", resize);
  }, []);

  // --- LÓGICA DE SUBMIT (REPARADA) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      // MODO REGISTRO: Crear usuario y perfil
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (authError) {
        toast.error("Error en registro: " + authError.message);
      } else if (authData.user) {
        // Creamos manualmente la fila en profiles con el nuevo ID
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: authData.user.id, 
              email: email.trim(), 
              full_name: fullName,
              role: 'EMPLOYEE' // Valor por defecto
            }
          ]);

        if (profileError) {
          toast.error("Usuario creado, pero error en perfil: " + profileError.message);
        } else {
          toast.success("¡Credenciales inicializadas correctamente!");
          setIsRegistering(false);
          // Opcional: limpiar campos
          setPassword("");
        }
      }
    } else {
      // MODO LOGIN: Acceso normal
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (error) {
        toast.error("Credenciales inválidas");
      } else {
        toast.success("Acceso concedido");
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617]">
      {/* Canvas de Estrellas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" />

      {/* Luces de Fondo (Nebulosa) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />

      <Card className="relative z-10 w-full max-w-[420px] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl transition-all duration-700 hover:border-blue-500/20">
        {/* Línea de escaneo futurista */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />

        <CardHeader className="pt-12 pb-8 text-center">
          <div className="mx-auto mb-6 relative group">
            <div className="absolute inset-[-8px] bg-blue-500 rounded-2xl blur-xl opacity-10 group-hover:opacity-30 transition-opacity" />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <CalendarDays className="h-9 w-9 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-[0.2em] text-white uppercase italic">
            {isRegistering ? "Register" : "Login"}
          </CardTitle>
          <p className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase opacity-60">PMO Interface v2.6</p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-10">
            {isRegistering && (
              <div className="space-y-1">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</Label>
                <div className="relative group">
                  <Input 
                    placeholder="FULL NAME" 
                    className="h-12 bg-black/40 border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/50 transition-all tracking-widest"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Email</Label>
              <div className="relative group">
                <Input 
                  type="email" 
                  placeholder="USER@GILATLA.COM" 
                  className="h-12 bg-black/40 border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/50 transition-all tracking-widest"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Token</Label>
              <div className="relative group">
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  className="h-12 bg-black/40 border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/50 transition-all tracking-widest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pb-14 pt-10 px-10">
            <Button 
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.2em] rounded-none border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
              type="submit" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegistering ? "INITIALIZE" : "ACCESS SYSTEM")}
            </Button>
            
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[10px] text-slate-500 hover:text-cyan-400 transition-all font-black tracking-widest"
            >
              {isRegistering ? "BACK TO AUTH" : "CREATE NEW CREDENTIAL"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}