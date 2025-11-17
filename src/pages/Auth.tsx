import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, Phone, Key, AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSMSService } from '@/hooks/useSMSService';
import { useTheme } from '@/hooks/useTheme';

// PIN de registro (hardcodeado por seguridad)
const REGISTRATION_PIN = '2510';
const ADMIN_PHONE = '+18098556302';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendSMS } = useSMSService();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: '✓ Bienvenido',
        description: 'Iniciaste sesión correctamente',
      });
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim() === '') {
      setError('Por favor ingresa un número de teléfono');
      return;
    }

    // Enviar PIN al teléfono
    const result = await sendSMS({
      phoneNumber: phone,
      message: `Tu PIN de registro en ALITO es: ${REGISTRATION_PIN}. No compartas este código con nadie.`,
    });

    if (result.success) {
      setPinSent(true);
      setShowPinVerification(true);
      toast({
        title: '✓ PIN Enviado',
        description: `Se ha enviado un PIN a ${phone}`,
      });
    } else {
      setError(result.error || 'Error al enviar el PIN. Intenta nuevamente.');
    }
  };

  const handlePinVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin !== REGISTRATION_PIN) {
      setError('PIN incorrecto. Por favor intenta nuevamente.');
      return;
    }

    // PIN es correcto, proceder con registro
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            phone: phone,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: '✓ Cuenta creada',
        description: 'Ya puedes iniciar sesión',
      });
      
      // Auto-login after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Cuenta creada. Por favor inicia sesión.');
        return;
      }

      navigate('/');
    } catch (err) {
      setError('Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-amber-50 via-yellow-50/30 to-orange-50/20'
    }`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-400/10'}`}
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse-slow ${
          theme === 'dark' ? 'bg-amber-600/10' : 'bg-yellow-400/20'
        }`}></div>
        <div className={`absolute top-1/2 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse-slow animation-delay-2000 ${
          theme === 'dark' ? 'bg-orange-600/10' : 'bg-amber-400/20'
        }`}></div>
        <div className={`absolute -bottom-40 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow animation-delay-4000 ${
          theme === 'dark' ? 'bg-yellow-600/10' : 'bg-orange-400/20'
        }`}></div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${
          theme === 'dark'
            ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'
            : 'bg-white/80 border-slate-200 hover:bg-white'
        }`}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl w-full items-center">
          {/* Left side - Illustration */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-8 animate-slide-in-left">
            {/* Logo grande sin bordes */}
            <div className="group relative">
              <div className={`absolute inset-0 rounded-3xl blur-2xl transition-all duration-500 group-hover:blur-3xl ${
                theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-400/30'
              }`}></div>
              <div className={`relative p-8 rounded-3xl backdrop-blur-sm transition-all duration-500 group-hover:scale-110 ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/50'
              }`}>
                <img 
                  src="/favicon.ico" 
                  alt="ALITO Logo" 
                  className="w-32 h-32 object-contain drop-shadow-2xl animate-float"
                />
              </div>
            </div>

            {/* Excavator Illustration - Blueprint Style */}
            <div className={`relative w-full max-w-md aspect-video rounded-2xl p-8 ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border border-slate-700' 
                : 'bg-blue-50/50 border border-blue-200'
            } backdrop-blur-sm overflow-hidden group`}>
              {/* Grid background */}
              <div className={`absolute inset-0 opacity-20 ${
                theme === 'dark' ? 'bg-grid-slate-700' : 'bg-grid-blue-300'
              }`} 
              style={{
                backgroundImage: `linear-gradient(${theme === 'dark' ? '#334155' : '#93c5fd'} 1px, transparent 1px),
                                  linear-gradient(90deg, ${theme === 'dark' ? '#334155' : '#93c5fd'} 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}></div>
              
              {/* Animated excavator SVG */}
              <svg viewBox="0 0 400 200" className="w-full h-full relative z-10">
                {/* Ground line */}
                <line 
                  x1="0" y1="160" x2="400" y2="160" 
                  stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                  className="animate-dash"
                />
                
                {/* Excavator body */}
                <g className="animate-excavator-body">
                  {/* Tracks */}
                  <rect 
                    x="80" y="140" width="100" height="20" 
                    fill="none" 
                    stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} 
                    strokeWidth="2"
                    rx="3"
                  />
                  <circle cx="95" cy="150" r="8" fill="none" stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} strokeWidth="2"/>
                  <circle cx="165" cy="150" r="8" fill="none" stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} strokeWidth="2"/>
                  
                  {/* Cabin */}
                  <rect 
                    x="100" y="100" width="60" height="40" 
                    fill="none" 
                    stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} 
                    strokeWidth="2.5"
                    rx="4"
                  />
                  <line x1="130" y1="100" x2="130" y2="140" stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} strokeWidth="1.5"/>
                  
                  {/* Boom (animated) */}
                  <g className="animate-excavator-boom origin-[160-120]">
                    <line 
                      x1="160" y1="120" x2="240" y2="80" 
                      stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} 
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="160" cy="120" r="5" fill={theme === 'dark' ? '#fbbf24' : '#2563eb'}/>
                  </g>
                  
                  {/* Arm (animated) */}
                  <g className="animate-excavator-arm">
                    <line 
                      x1="240" y1="80" x2="280" y2="100" 
                      stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} 
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="240" cy="80" r="4" fill={theme === 'dark' ? '#fbbf24' : '#2563eb'}/>
                  </g>
                  
                  {/* Bucket (animated) */}
                  <g className="animate-excavator-bucket">
                    <path 
                      d="M 280 100 L 295 115 L 285 120 L 275 110 Z" 
                      fill="none" 
                      stroke={theme === 'dark' ? '#fbbf24' : '#2563eb'} 
                      strokeWidth="2"
                    />
                    <circle cx="280" cy="100" r="3" fill={theme === 'dark' ? '#fbbf24' : '#2563eb'}/>
                  </g>
                </g>
                
                {/* Dimension lines */}
                <line x1="80" y1="170" x2="180" y2="170" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} strokeWidth="1" strokeDasharray="2,2"/>
                <text x="130" y="185" fill={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize="10" textAnchor="middle">100mm</text>
              </svg>
              
              {/* Blueprint corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500/50"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500/50"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500/50"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500/50"></div>
            </div>

            {/* Company info */}
            <div className="text-center space-y-2 animate-fade-in animation-delay-1000">
              <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                ALITO GROUP SRL
              </h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} font-semibold`}>
                Mantenimiento Inteligente
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Control total de tu maquinaria pesada
              </p>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="w-full max-w-[440px] mx-auto lg:mx-0">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 text-center animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="group relative">
                  <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 group-hover:blur-2xl ${
                    theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-400/30'
                  }`}></div>
                  <div className={`relative p-4 rounded-2xl backdrop-blur-sm transition-all duration-500 group-hover:scale-110 ${
                    theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/50'
                  }`}>
                    <img 
                      src="/favicon.ico" 
                      alt="ALITO Logo" 
                      className="w-16 h-16 object-contain animate-float"
                    />
                  </div>
                </div>
              </div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-1`}>
                ALITO GROUP SRL
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Mantenimiento inteligente
              </p>
            </div>

          {/* Auth Card */}
          <div className={`rounded-3xl shadow-2xl overflow-hidden animate-slide-up backdrop-blur-xl border transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-slate-800/90 border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
              : 'bg-white/95 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
          }`}>
            {!showPinVerification ? (
              <>
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-8 pt-8 pb-6">
                    <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {activeTab === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>
                    <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {activeTab === 'signin' 
                        ? 'Te enviaremos un código por correo electrónico' 
                        : 'Complete los datos para crear su cuenta'}
                    </p>

                    {/* Tab Switcher - Minimal */}
                    <div className="flex gap-2 mb-6">
                      <Button
                        type="button"
                        variant={activeTab === 'signin' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('signin')}
                        className={`flex-1 transition-all duration-300 ${
                          activeTab === 'signin' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/50' 
                            : theme === 'dark'
                              ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        Iniciar Sesión
                      </Button>
                      <Button
                        type="button"
                        variant={activeTab === 'signup' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('signup')}
                        className={`flex-1 transition-all duration-300 ${
                          activeTab === 'signup' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/50' 
                            : theme === 'dark'
                              ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        Registrarse
                      </Button>
                    </div>
                  </div>

                  {/* Sign In Tab */}
                  <TabsContent value="signin" className="px-8 pb-8 space-y-4 mt-0">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      {/* Email Input */}
                      <div className="space-y-2">
                        <Label htmlFor="email-signin" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Correo Electrónico
                        </Label>
                        <div className="relative group">
                          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                            theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                          }`} />
                          <Input
                            id="email-signin"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className={`pl-11 h-12 transition-all duration-300 rounded-xl ${
                              theme === 'dark'
                                ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="password-signin" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Contraseña
                        </Label>
                        <div className="relative group">
                          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                            theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                          }`} />
                          <Input
                            id="password-signin"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className={`pl-11 h-12 transition-all duration-300 rounded-xl ${
                              theme === 'dark'
                                ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Remember me & Forgot password */}
                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className={`w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer transition-all ${
                              theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''
                            }`}
                          />
                          <span className={`transition-colors ${
                            theme === 'dark' ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-800'
                          }`}>Recordarme</span>
                        </label>
                        <button
                          type="button"
                          className="text-amber-500 hover:text-amber-600 font-medium transition-colors relative group"
                        >
                          <span className="relative z-10">¿Olvidó su contraseña?</span>
                          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                        </button>
                      </div>

                      {/* Error Alert */}
                      {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 animate-shake rounded-xl">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 text-sm ml-2">{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Sign In Button */}
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-semibold rounded-xl transition-all duration-500 shadow-lg shadow-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/60 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group" 
                        disabled={loading}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Iniciando sesión...
                          </>
                        ) : (
                          <span className="relative z-10">Iniciar Sesión</span>
                        )}
                      </Button>

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className={`w-full border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className={`px-2 ${
                            theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-500'
                          }`}>O continuar con</span>
                        </div>
                      </div>

                      {/* Google Sign In Button */}
                      <Button 
                        type="button"
                        variant="outline"
                        className={`w-full h-12 border-2 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group ${
                          theme === 'dark'
                            ? 'border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-white'
                            : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Tab */}
                  <TabsContent value="signup" className="px-8 pb-8 space-y-4 mt-0">
                    <form onSubmit={handleSignUpStep1} className="space-y-4">
                      {/* Email Input */}
                      <div className="space-y-2">
                        <Label htmlFor="email-signup" className="text-sm font-semibold text-slate-700">
                          Correo Electrónico
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="email-signup"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all duration-200 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                          Teléfono
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (809) 855-6302"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all duration-200 rounded-xl"
                          />
                        </div>
                        <p className="text-xs text-slate-500">Recibirás un PIN por SMS para verificación</p>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="password-signup" className="text-sm font-semibold text-slate-700">
                          Contraseña
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="password-signup"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all duration-200 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Confirm Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">
                          Confirmar Contraseña
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-11 h-12 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all duration-200 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Error Alert */}
                      {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 animate-shake rounded-xl">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 text-sm ml-2">{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Sign Up Button */}
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando PIN...
                          </>
                        ) : (
                          'Continuar'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className={`px-8 py-5 border-t ${
                  theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                }`}>
                  <p className={`text-xs text-center leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeTab === 'signin' ? (
                      <>
                        ¿No tiene una cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('signup')}
                          className="text-amber-500 hover:text-amber-600 font-semibold transition-colors relative group"
                        >
                          <span className="relative z-10">Regístrese aquí</span>
                          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                        </button>
                      </>
                    ) : (
                      <>
                        Al continuar, acepta nuestros{' '}
                        <span className="text-amber-500 hover:text-amber-600 cursor-pointer font-medium transition-colors">términos de servicio</span>
                        {' '}y{' '}
                        <span className="text-amber-500 hover:text-amber-600 cursor-pointer font-medium transition-colors">política de privacidad</span>
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : (
              // PIN Verification Step
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-4">
                    <Key className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Verificación PIN</h2>
                  <p className="text-sm text-slate-600">
                    Hemos enviado un código de verificación a<br/>
                    <span className="font-semibold text-amber-600">{phone}</span>
                  </p>
                </div>

                <form onSubmit={handlePinVerification} className="space-y-4">
                  {/* PIN Input */}
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-sm font-semibold text-slate-700">
                      Código PIN
                    </Label>
                    <Input
                      id="pin"
                      type="text"
                      placeholder="0000"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      required
                      disabled={loading}
                      className="h-14 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all duration-200 text-center text-3xl tracking-[0.5em] font-bold rounded-xl"
                    />
                    {pinSent && (
                      <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Código enviado exitosamente
                      </p>
                    )}
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 animate-shake rounded-xl">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-sm ml-2">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Verify Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar y Crear Cuenta'
                    )}
                  </Button>

                  {/* Back Button */}
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl"
                    onClick={() => {
                      setShowPinVerification(false);
                      setPin('');
                      setError(null);
                      setPinSent(false);
                    }}
                  >
                    Volver
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className={`mt-6 flex items-center justify-center gap-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="font-medium">Conexión segura y encriptada</span>
          </div>
        </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(5deg); }
          50% { transform: translateY(-5px) rotate(-5deg); }
          75% { transform: translateY(-10px) rotate(3deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
        
        @keyframes excavator-boom {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }
        
        @keyframes excavator-arm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        
        @keyframes excavator-bucket {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(5deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-dash {
          animation: dash 1s linear infinite;
        }
        
        .animate-excavator-boom {
          animation: excavator-boom 4s ease-in-out infinite;
          transform-origin: 160px 120px;
        }
        
        .animate-excavator-arm {
          animation: excavator-arm 4s ease-in-out infinite 0.2s;
          transform-origin: 240px 80px;
        }
        
        .animate-excavator-bucket {
          animation: excavator-bucket 4s ease-in-out infinite 0.4s;
          transform-origin: 280px 100px;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .bg-size-200 {
          background-size: 200% 100%;
        }
        
        .bg-pos-0 {
          background-position: 0% 0%;
        }
        
        .bg-pos-100 {
          background-position: 100% 0%;
        }
      `}</style>
    </div>
  );
}
