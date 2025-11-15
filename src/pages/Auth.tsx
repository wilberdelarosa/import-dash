import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, CheckCircle2, AlertCircle, Phone, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSMSService } from '@/hooks/useSMSService';

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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Animated gradient blobs - Colores verde corporativo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-green-300/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-green-400/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-300/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="mb-8 text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300 border-2 border-green-100">
                <img 
                  src="/favicon.ico" 
                  alt="ALITO Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2 drop-shadow">ALITO GROUP</h1>
            <p className="text-sm text-green-700 font-semibold">Sistema de Gestión de Maquinaria</p>
            <p className="text-xs text-slate-500 mt-1">Mantén el control de tu equipo</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-green-100/50 shadow-2xl overflow-hidden animate-slide-up">
            {!showPinVerification ? (
              <>
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-green-50/50 border-b border-green-100/50 rounded-none p-1">
                    <TabsTrigger 
                      value="signin"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Registrarse
                    </TabsTrigger>
                  </TabsList>

                  {/* Sign In Tab */}
                  <TabsContent value="signin" className="p-6 space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      {/* Email Input */}
                      <div className="space-y-2">
                        <Label htmlFor="email-signin" className="text-slate-700 font-semibold">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                          <Input
                            id="email-signin"
                            type="email"
                            placeholder="ejemplo@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="password-signin" className="text-slate-700 font-semibold">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                          <Input
                            id="password-signin"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Error Alert */}
                      {error && (
                        <Alert variant="destructive" className="bg-red-50/80 border-red-200/80 animate-shake">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 text-sm ml-2 font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Sign In Button */}
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 h-11 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando sesión...
                          </>
                        ) : (
                          'Iniciar Sesión'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Tab */}
                  <TabsContent value="signup" className="p-6 space-y-4">
                    <form onSubmit={handleSignUpStep1} className="space-y-4">
                      {/* Email Input */}
                      <div className="space-y-2">
                        <Label htmlFor="email-signup" className="text-slate-700 font-semibold">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                          <Input
                            id="email-signup"
                            type="email"
                            placeholder="ejemplo@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 font-semibold">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (809) 855-6302"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200"
                          />
                        </div>
                        <p className="text-xs text-slate-500">Recibirás un PIN por SMS para verificar tu identidad</p>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="password-signup" className="text-slate-700 font-semibold">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                          <Input
                            id="password-signup"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Confirm Password Input */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-slate-700 font-semibold">Confirmar Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Error Alert */}
                      {error && (
                        <Alert variant="destructive" className="bg-red-50/80 border-red-200/80 animate-shake">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 text-sm ml-2 font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Sign Up Button */}
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 h-11 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando PIN...
                          </>
                        ) : (
                          'Enviar PIN'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="px-6 py-4 bg-green-50/30 border-t border-green-100/50">
                  <p className="text-xs text-center text-slate-600">
                    Al continuar, aceptas nuestros{' '}
                    <span className="text-green-700 hover:text-green-800 cursor-pointer transition-colors font-semibold">términos de servicio</span>
                    {' '}y{' '}
                    <span className="text-green-700 hover:text-green-800 cursor-pointer transition-colors font-semibold">política de privacidad</span>
                  </p>
                </div>
              </>
            ) : (
              // PIN Verification Step
              <div className="p-6 space-y-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                    <Key className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Verificación PIN</h2>
                  <p className="text-sm text-slate-600 mt-2">
                    Hemos enviado un PIN a <span className="font-semibold text-green-700">{phone}</span>
                  </p>
                </div>

                <form onSubmit={handlePinVerification} className="space-y-4">
                  {/* PIN Input */}
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-slate-700 font-semibold">Ingresa el PIN</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-5 w-5 text-green-600 pointer-events-none" />
                      <Input
                        id="pin"
                        type="text"
                        placeholder="0000"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        required
                        disabled={loading}
                        className="pl-10 bg-white border-2 border-green-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/50 focus:ring-2 transition-all duration-200 text-center text-2xl tracking-widest font-bold"
                      />
                    </div>
                    {pinSent && (
                      <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> PIN enviado correctamente
                      </p>
                    )}
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50/80 border-red-200/80 animate-shake">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-sm ml-2 font-medium">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Verify Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 h-11 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Verificar PIN y Crear Cuenta'
                    )}
                  </Button>

                  {/* Back Button */}
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
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
          <div className="mt-6 text-center text-xs text-slate-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-medium">Conexión segura y encriptada</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
