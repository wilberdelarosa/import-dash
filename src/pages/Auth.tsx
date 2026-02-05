import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
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

  const [currentVehicle, setCurrentVehicle] = useState(0);
  const vehicleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const vehicles = [
    { name: 'Excavadora', id: 'excavator' },
    { name: 'Camión Volteo', id: 'dumptruck' },
    { name: 'Montacargas', id: 'forklift' },
    { name: 'Compactadora', id: 'steamroller' }
  ];

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    // Auto-rotate vehicles every 4 seconds
    vehicleIntervalRef.current = setInterval(() => {
      setCurrentVehicle((prev) => (prev + 1) % vehicles.length);
    }, 4000);

    return () => {
      if (vehicleIntervalRef.current) {
        clearInterval(vehicleIntervalRef.current);
      }
    };
  }, [navigate, vehicles.length]);

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
    <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-500 ${theme === 'dark'
      ? 'bg-slate-950'
      : 'bg-slate-50'
      }`}>

      {/* Animated Gradient Background */}
      <div className={`absolute inset-0 animate-gradient-flow ${theme === 'dark'
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30'
        : 'bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50'
        }`} style={{ backgroundSize: '400% 400%' }} />

      {/* 3D Glowing Orbs - Multiple layers for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large background orbs */}
        <div className={`absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] animate-orb-float ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-400/30'
          }`} />
        <div className={`absolute top-1/3 -left-48 w-[400px] h-[400px] rounded-full blur-[80px] animate-orb-float-delayed ${theme === 'dark' ? 'bg-orange-600/15' : 'bg-orange-300/25'
          }`} />
        <div className={`absolute -bottom-32 right-1/4 w-[450px] h-[450px] rounded-full blur-[90px] animate-orb-pulse ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-400/20'
          }`} />

        {/* Medium floating orbs with glow */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className={`absolute rounded-full animate-orb-3d ${theme === 'dark'
              ? 'bg-gradient-radial from-amber-400/30 via-orange-500/10 to-transparent shadow-[0_0_60px_20px_rgba(251,191,36,0.15)]'
              : 'bg-gradient-radial from-amber-300/40 via-orange-300/15 to-transparent shadow-[0_0_60px_20px_rgba(251,191,36,0.1)]'
              }`}
            style={{
              width: `${80 + i * 30}px`,
              height: `${80 + i * 30}px`,
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}

        {/* Small accent particles with 3D effect */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className={`absolute rounded-full animate-particle-float ${theme === 'dark'
              ? 'bg-gradient-to-br from-amber-400/50 to-orange-500/30'
              : 'bg-gradient-to-br from-amber-300/60 to-orange-400/40'
              }`}
            style={{
              width: `${6 + (i % 4) * 4}px`,
              height: `${6 + (i % 4) * 4}px`,
              left: `${5 + i * 8}%`,
              top: `${10 + (i * 7) % 80}%`,
              animationDelay: `${i * 0.5}s`,
              boxShadow: theme === 'dark'
                ? `0 0 ${10 + i * 2}px ${4 + i}px rgba(251,191,36,0.3)`
                : `0 0 ${8 + i * 2}px ${3 + i}px rgba(251,191,36,0.2)`,
            }}
          />
        ))}
      </div>

      {/* Mesh gradient overlay for premium feel */}
      <div className={`absolute inset-0 opacity-50 ${theme === 'dark' ? 'bg-gradient-mesh-dark' : 'bg-gradient-mesh-light'
        }`} />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-110 ${theme === 'dark'
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
              <div className={`absolute inset-0 rounded-3xl blur-2xl transition-all duration-500 group-hover:blur-3xl ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-400/30'
                }`}></div>
              <div className={`relative p-8 rounded-3xl backdrop-blur-sm transition-all duration-500 group-hover:scale-110 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/50'
                }`}>
                <img
                  src="/favicon.ico"
                  alt="ALITO Logo"
                  className="w-32 h-32 object-contain drop-shadow-2xl animate-float"
                />
              </div>
            </div>

            {/* Vehicle Carousel - 3D Premium Style */}
            <div className={`relative w-full max-w-md aspect-video rounded-2xl p-6 ${theme === 'dark'
              ? 'bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80 border border-slate-600/50'
              : 'bg-gradient-to-br from-slate-100/90 via-white/95 to-slate-50/90 border border-slate-300/50'
              } backdrop-blur-xl overflow-hidden group shadow-2xl`}
              style={{ perspective: '1000px' }}
            >
              {/* Animated glow border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 animate-border-glow opacity-50" />

              {/* Grid background - more visible */}
              <div className={`absolute inset-0 opacity-30 ${theme === 'dark' ? 'opacity-20' : 'opacity-25'}`}
                style={{
                  backgroundImage: `linear-gradient(${theme === 'dark' ? '#475569' : '#94a3b8'} 1px, transparent 1px),
                                  linear-gradient(90deg, ${theme === 'dark' ? '#475569' : '#94a3b8'} 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}></div>

              {/* Subtle inner shadow for depth */}
              <div className={`absolute inset-0 rounded-2xl pointer-events-none ${theme === 'dark'
                ? 'shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]'
                : 'shadow-[inset_0_0_30px_rgba(0,0,0,0.08)]'
                }`} />

              {/* Vehicle SVGs Container with 3D transform */}
              <div className="relative w-full h-full z-10" style={{ transformStyle: 'preserve-3d' }}>
                {/* Excavator */}
                {currentVehicle === 0 && (
                  <svg viewBox="0 0 512 512" className="w-full h-full animate-fade-in">
                    <defs>
                      <linearGradient id="excavatorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#FCD34D', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#D97706', stopOpacity: 1 }} />
                      </linearGradient>
                      <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#94A3B8', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#64748B', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#475569', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="shadow">
                        <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.4" />
                      </filter>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <g className="vehicle-float animate-vehicle-enter" filter="url(#shadow)">
                      <polygon style={{ fill: '#DBDBDB' }} points="391.694,246.208 425.268,246.208 425.268,179.06 391.694,167.869" />
                      <polygon style={{ fill: 'url(#excavatorGradient)' }} points="235.016,179.06 210.233,112.178 268.59,89.53 324.546,156.678" />
                      <polygon style={{ fill: '#EFC27B' }} points="268.59,89.53 246.208,98.217 246.208,176.262 324.546,156.678" />
                      <path style={{ fill: '#797781' }} d="M229.421,380.503h223.825c27.811,0,50.361,22.549,50.361,50.361s-22.549,50.361-50.361,50.361 H229.421c-27.811,0-50.361-22.549-50.361-50.361S201.609,380.503,229.421,380.503z" />
                      <path style={{ fill: '#58575D' }} d="M453.246,380.503H246.208v100.721h207.038c27.811,0,50.361-22.549,50.361-50.361 S481.057,380.503,453.246,380.503z" />
                      <rect x="235.016" y="324.546" style={{ fill: 'url(#excavatorGradient)' }} width="212.634" height="55.956" />
                      <rect x="246.208" y="324.546" style={{ fill: '#EFC27B' }} width="201.443" height="55.956" />
                      <polygon style={{ fill: '#EFC27B' }} points="78.339,22.383 11.191,22.383 11.191,346.929 55.956,346.929" />
                      <polygon style={{ fill: 'url(#excavatorGradient)' }} points="44.765,111.913 235.016,123.104 235.016,55.956 44.765,67.148" />
                      <g className="excavator-boom">
                        <circle style={{ fill: '#F8E99B' }} cx="235.016" cy="89.53" r="33.574" />
                        <circle style={{ fill: '#fbbf24' }} cx="235.016" cy="89.53" r="15" />
                      </g>
                      <circle style={{ fill: '#F8E99B' }} cx="44.765" cy="89.53" r="22.383" />
                      <path style={{ fill: 'url(#excavatorGradient)' }} d="M100.721,436.459H50.361C22.547,436.459,0,413.912,0,386.098v-50.361h50.361 c27.814,0,50.361,22.547,50.361,50.361V436.459z" />
                      <path style={{ fill: '#F8E99B' }} d="M481.224,246.208v89.53H201.443v-89.53c0-49.446,40.084-89.53,89.53-89.53h44.765v89.53H481.224z" />
                      <path style={{ fill: 'url(#excavatorGradient)' }} d="M481.224,246.208H335.738v-89.53h-44.765c-16.313,0-31.593,4.385-44.765,12.008v167.052h235.016 V246.208z" />
                      <rect x="369.311" y="223.825" style={{ fill: '#797781' }} width="78.339" height="44.765" />
                      <path style={{ fill: '#88888F' }} d="M453.246,489.617H229.421c-32.398,0-58.754-26.357-58.754-58.754s26.357-58.754,58.754-58.754 h223.825c32.398,0,58.754,26.357,58.754,58.754S485.643,489.617,453.246,489.617z M229.421,388.896 c-23.141,0-41.967,18.826-41.967,41.967s18.826,41.967,41.967,41.967h223.825c23.141,0,41.967-18.826,41.967-41.967 s-18.826-41.967-41.967-41.967H229.421z" />
                      <circle style={{ fill: '#DBDBDB' }} cx="453.246" cy="444.852" r="13.989" />
                      <circle style={{ fill: '#EDEDED' }} cx="229.421" cy="444.852" r="13.989" />
                      <path style={{ fill: '#D1E5F5' }} d="M246.208,246.208c0-24.723,20.042-44.765,44.765-44.765v44.765H246.208z" />
                      {/* Detalles adicionales */}
                      <circle style={{ fill: '#fbbf24', opacity: 0.3 }} cx="300" cy="200" r="5" className="vehicle-glow" />
                      <line x1="260" y1="350" x2="420" y2="350" stroke="#fbbf24" strokeWidth="2" opacity="0.5" />
                    </g>
                  </svg>
                )}

                {/* Dump Truck */}
                {currentVehicle === 1 && (
                  <svg viewBox="0 0 512 512" className="w-full h-full animate-fade-in">
                    <defs>
                      <linearGradient id="truckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#F8E99B', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#F6E27D', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="truckShadow">
                        <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.3" />
                      </filter>
                    </defs>
                    <g filter="url(#truckShadow)">
                      <path style={{ fill: '#88888F' }} d="M429.861,430.956H76.663c-4.536,0-8.214-3.678-8.214-8.214s3.678-8.214,8.214-8.214h353.198 c4.537,0,8.214,3.678,8.214,8.214S434.398,430.956,429.861,430.956z" />
                      <g className="truck-body">
                        <polygon style={{ fill: '#EFC27B' }} points="62.973,203.705 62.973,159.897 139.636,159.897 205.349,203.705 369.626,203.705 369.626,357.031 62.973,357.031" />
                        <rect x="251.893" y="203.705" style={{ fill: '#ECB45C' }} width="117.733" height="153.326" />
                        <polygon style={{ fill: 'url(#truckGradient)' }} points="183.939,307.834 170.594,192.753 501.048,192.753 501.048,252.567 303.914,313.224" />
                        <polygon style={{ fill: '#EFC27B' }} points="251.893,192.753 251.893,310.886 303.914,313.224 501.048,252.567 501.048,192.753" />
                        {/* Ventanas con brillo */}
                        <rect x="100" y="180" width="40" height="35" fill="#D1E5F5" opacity="0.6" />
                        <rect x="280" y="210" width="60" height="40" fill="#D1E5F5" opacity="0.6" />
                      </g>
                      <path style={{ fill: '#797781' }} d="M493.782,180.252c-13.078-12.086-13.677-6.454-30.603-19.737 c-8.254-6.479-15.093-17.242-25.957-24.736c-9.435-6.51-22.366-9.531-33.112-15.817c-10.355-6.055-18.865-15.61-29.884-20.617 c-11.329-5.147-24.586-5.46-36.029-8.616c-12.362-3.41-23.942-9.686-35.718-9.686c-9.076,0-16.499,5.83-24.077,8.63 c-7.998,2.955-17.619,3.548-24.066,8.684c-6.44,5.131-8.672,14.058-13.678,20.404c-5.131,6.504-13.565,11.106-17.315,17.867 c-4.225,7.621-3.282,16.84-5.919,23.392c-5.262,13.072-9.303,9.775-12.076,21.306" />
                      <path style={{ fill: '#88888F' }} d="M320.044,98.832c-6.439,5.131-8.669,14.058-13.677,20.404c-5.132,6.504-13.566,11.106-17.316,17.867 c-4.224,7.621-3.281,16.841-5.918,23.392c-5.223,12.976-9.242,9.83-12.013,21.06l-65.773,0.245 c2.773-11.531,6.813-8.234,12.076-21.306c2.637-6.551,1.693-15.771,5.919-23.392c3.75-6.761,12.184-11.363,17.315-17.867 c5.007-6.347,7.238-15.273,13.678-20.404c6.446-5.135,16.067-5.728,24.066-8.684c7.579-2.8,15.001-8.63,24.077-8.63 c11.778,0,23.356,6.275,35.717,9.686c0.467,0.128,0.939,0.245,1.409,0.366C332.712,93.47,325.318,94.633,320.044,98.832z" />
                      <path style={{ fill: 'url(#truckGradient)' }} d="M52.021,137.994h98.567l32.856,32.856h317.604c6.049,0,10.952,4.903,10.952,10.952v10.952 c0,6.049-4.903,10.952-10.952,10.952H172.492l-32.856-32.856H52.021c-6.049,0-10.952-4.903-10.952-10.952v-10.952 C41.07,142.897,45.973,137.994,52.021,137.994z" />
                      <circle style={{ fill: '#797781' }} cx="369.626" cy="357.031" r="65.711" />
                      <circle style={{ fill: '#DBDBDB' }} cx="369.626" cy="357.031" r="21.904" />
                      <circle style={{ fill: '#88888F' }} cx="139.636" cy="357.031" r="65.711" />
                      <circle style={{ fill: '#EDEDED' }} cx="139.636" cy="357.031" r="21.904" />
                      {/* Detalles de llantas */}
                      <circle style={{ fill: '#58575D' }} cx="369.626" cy="357.031" r="8" />
                      <circle style={{ fill: '#58575D' }} cx="139.636" cy="357.031" r="8" />
                      <path style={{ fill: '#88888F' }} d="M216.299,302.272h76.663c6.049,0,10.952,4.903,10.952,10.952v43.807 c0,6.049-4.903,10.952-10.952,10.952h-76.663c-6.049,0-10.952-4.903-10.952-10.952v-43.807 C205.348,307.175,210.251,302.272,216.299,302.272z" />
                      <rect x="19.166" y="170.849" style={{ fill: '#D1E5F5' }} width="98.567" height="43.807" />
                      <path style={{ fill: 'url(#truckGradient)' }} d="M19.166,203.705h120.471l10.952,87.615H73.925v65.711H8.214V214.657 C8.214,208.608,13.117,203.705,19.166,203.705z" />
                      <polygon style={{ fill: '#F8F8F9' }} points="146.481,258.464 8.214,258.464 8.214,225.609 142.374,225.609" />
                      {/* Luces */}
                      <circle style={{ fill: '#fbbf24', opacity: 0.6 }} cx="160" cy="190" r="8" className="vehicle-glow" />
                      <circle style={{ fill: '#ef4444', opacity: 0.6 }} cx="65" cy="340" r="6" />
                    </g>
                  </svg>
                )}

                {/* Forklift */}
                {currentVehicle === 2 && (
                  <svg viewBox="0 0 512 512" className="w-full h-full animate-fade-in">
                    <defs>
                      <linearGradient id="forkliftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#F8E99B', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#F6E27D', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="forkliftShadow">
                        <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.3" />
                      </filter>
                    </defs>
                    <g filter="url(#forkliftShadow)">
                      <g className="forklift-mast">
                        <path style={{ fill: '#797781' }} d="M422.831,245.933c0-9.531-7.727-17.258-17.258-17.258h-57.528c-9.531,0-17.258,7.727-17.258,17.258 c0,7.511,4.807,13.884,11.506,16.255v12.509h69.034v-12.509C418.024,259.816,422.831,253.443,422.831,245.933z" />
                        <rect x="342.292" y="263.191" style={{ fill: '#58575D' }} width="69.034" height="57.528" />
                        {/* Detalles del mástil */}
                        <rect x="348" y="100" width="8" height="160" fill="#797781" opacity="0.7" />
                        <rect x="395" y="100" width="8" height="160" fill="#797781" opacity="0.7" />
                      </g>
                      <path style={{ fill: '#88888F' }} d="M238.742,84.279c-32.944,0-39.694,62.324-39.694,155.901c0,4.766,3.864,8.629,8.629,8.629 s8.629-3.864,8.629-8.629c0-47.231,1.867-80.004,5.874-103.141c3.851-22.23,10.042-35.502,16.562-35.502V84.279z" />
                      <path style={{ fill: '#58575D' }} d="M441.482,144.478c-2.975-14.889-12.03-60.2-41.662-60.2v17.258c9.838,0,18.855,16.884,24.738,46.324 c6.107,30.559,9.203,75.169,9.203,132.588c0,4.766,3.864,8.629,8.629,8.629s8.629-3.864,8.629-8.629 C451.02,221.896,447.811,176.149,441.482,144.478z" />
                      <path style={{ fill: '#797781' }} d="M399.82,176.899c0-9.531,7.727-17.258,17.258-17.258l0,0c9.531,0,17.258,7.727,17.258,17.258v34.517 c0,9.531-7.727,17.258-17.258,17.258l0,0c-9.531,0-17.258-7.727-17.258-17.258V176.899z" />
                      <path style={{ fill: 'url(#forkliftGradient)' }} d="M238.742,67.596h195.596v34.517H204.225C204.225,83.05,219.679,67.596,238.742,67.596z" />
                      <rect x="250.247" y="67.596" style={{ fill: '#F6E27D' }} width="184.09" height="34.517" />
                      <path style={{ fill: '#797781' }} d="M89.169,412.764H8.629C3.864,412.764,0,408.9,0,404.135s3.864-8.629,8.629-8.629h80.539 c4.766,0,8.629,3.864,8.629,8.629S93.934,412.764,89.169,412.764z" />
                      <rect x="89.169" y="274.697" style={{ fill: '#EDEDED' }} width="34.517" height="138.067" />
                      <rect x="112.18" y="113.618" style={{ fill: '#797781' }} width="46.022" height="299.146" />
                      <polygon style={{ fill: '#58575D' }} points="457.348,384 388.315,384 388.315,314.966 457.348,320.719" />
                      <rect x="192.719" y="240.18" style={{ fill: 'url(#forkliftGradient)' }} width="103.551" height="161.079" />
                      <rect x="250.247" y="240.18" style={{ fill: '#F6E27D' }} width="46.022" height="161.079" />
                      <circle style={{ fill: '#797781' }} cx="451.596" cy="384" r="51.775" />
                      <circle style={{ fill: '#DBDBDB' }} cx="451.596" cy="384" r="14.382" />
                      <circle style={{ fill: '#88888F' }} cx="198.472" cy="384" r="51.775" />
                      <circle style={{ fill: '#EDEDED' }} cx="198.472" cy="384" r="14.382" />
                      <path style={{ fill: '#88888F' }} d="M503.371,444.405H146.697c-4.766,0-8.629-3.864-8.629-8.629s3.864-8.629,8.629-8.629h356.674 c4.766,0,8.629,3.864,8.629,8.629S508.136,444.405,503.371,444.405z" />
                      <polygon style={{ fill: '#EFC27B' }} points="457.348,332.225 399.82,332.225 399.82,401.258 250.247,401.258 250.247,320.719 457.348,274.697" />
                      {/* Ventanas cabina */}
                      <rect x="210" y="260" width="35" height="40" fill="#D1E5F5" opacity="0.5" />
                      {/* Luz de advertencia */}
                      <circle style={{ fill: '#f97316', opacity: 0.7 }} cx="240" cy="230" r="6" className="vehicle-glow" />
                    </g>
                  </svg>
                )}

                {/* Steamroller */}
                {currentVehicle === 3 && (
                  <svg viewBox="0 0 512 512" className="w-full h-full animate-fade-in">
                    <defs>
                      <linearGradient id="rollerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#F8E99B', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#F6E27D', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="rollerShadow">
                        <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.3" />
                      </filter>
                    </defs>
                    <g filter="url(#rollerShadow)">
                      <path style={{ fill: '#D1E5F5' }} d="M249.155,98.567c36.291,0,43.807,7.516,43.807,43.807v98.567H150.588V98.567 C150.588,98.567,205.348,98.567,249.155,98.567z" />
                      <path style={{ fill: '#B4D8F1' }} d="M150.588,240.941l142.374,10.952V142.374c0-18.145-1.879-29.097-8.295-35.513L150.588,240.941z" />
                      <path style={{ fill: '#88888F' }} d="M249.155,76.663c-43.807,0-98.567,0-98.567,0v43.807h98.567c12.097,0,21.904,9.806,21.904,21.904 v98.567h43.807v-98.567C314.866,106.083,285.446,76.663,249.155,76.663z" />
                      <path style={{ fill: '#797781' }} d="M260.107,77.589v45.836c6.542,3.789,10.952,10.847,10.952,18.95v109.519h43.807V142.374 C314.866,109.816,291.182,82.805,260.107,77.589z" />
                      <rect x="282.011" y="262.845" style={{ fill: '#EFC27B' }} width="109.519" height="131.422" />
                      {/* Ventana cabina */}
                      <rect x="295" y="280" width="40" height="35" fill="#D1E5F5" opacity="0.6" />
                      <path style={{ fill: '#88888F' }} d="M446.289,435.337H8.214c-4.537,0-8.214-3.678-8.214-8.214c0-4.536,3.677-8.214,8.214-8.214h438.075 c4.537,0,8.214,3.678,8.214,8.214C454.503,431.659,450.826,435.337,446.289,435.337z" />
                      <path style={{ fill: '#797781' }} d="M205.348,353.198h-32.856c-4.537,0-8.214-3.678-8.214-8.214c0-4.536,3.677-8.214,8.214-8.214h32.856 c4.537,0,8.214,3.678,8.214,8.214C213.562,349.52,209.885,353.198,205.348,353.198z" />
                      <polygon style={{ fill: 'url(#rollerGradient)' }} points="150.588,240.941 205.348,306.652 205.348,394.267 314.866,394.267 314.866,295.701 380.578,295.701 446.289,372.364 479.144,372.364 512,306.652 479.144,240.941" />
                      <g className="roller-drum">
                        <circle style={{ fill: '#88888F' }} cx="90.353" cy="344.984" r="82.139" />
                        <circle style={{ fill: '#58575D' }} cx="90.353" cy="344.984" r="60" />
                        <circle style={{ fill: '#797781' }} cx="90.353" cy="344.984" r="40" />
                        {/* Líneas del rodillo */}
                        <line x1="90.353" y1="262.845" x2="90.353" y2="427.123" stroke="#DBDBDB" strokeWidth="2" opacity="0.3" />
                        <line x1="8.214" y1="344.984" x2="172.492" y2="344.984" stroke="#DBDBDB" strokeWidth="2" opacity="0.3" />
                      </g>
                      <rect x="8.214" y="317.604" style={{ fill: '#EDEDED' }} width="164.278" height="54.759" />
                      <polygon style={{ fill: '#DBDBDB' }} points="380.578,240.941 413.433,240.941 413.433,175.23 380.578,164.278" />
                      <rect x="358.674" y="219.037" style={{ fill: '#797781' }} width="76.663" height="43.807" />
                      <polygon style={{ fill: 'url(#rollerGradient)' }} points="479.144,240.941 260.107,240.941 260.107,394.267 314.866,394.267 314.866,295.701 380.578,295.701 446.289,372.364 479.144,372.364 512,306.652" />
                      <circle style={{ fill: '#797781' }} cx="380.578" cy="361.412" r="65.711" />
                      <circle style={{ fill: '#DBDBDB' }} cx="380.578" cy="361.412" r="21.904" />
                      <circle style={{ fill: '#58575D' }} cx="380.578" cy="361.412" r="8" />
                      <path style={{ fill: 'url(#rollerGradient)' }} d="M501.048,170.849H251.893v32.856h249.155c6.049,0,10.952-4.903,10.952-10.952v-10.952 C512,175.752,507.097,170.849,501.048,170.849z" />
                      {/* Luz de advertencia */}
                      <circle style={{ fill: '#f97316', opacity: 0.7 }} cx="300" cy="250" r="7" className="vehicle-glow" />
                    </g>
                  </svg>
                )}
              </div>

              {/* Vehicle Name Label */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className={`px-4 py-1.5 rounded-full backdrop-blur-sm ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white/80'
                  }`}>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-amber-400' : 'text-blue-600'
                    }`}>
                    {vehicles[currentVehicle].name}
                  </span>
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                {vehicles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentVehicle(index);
                      // Reset interval
                      if (vehicleIntervalRef.current) {
                        clearInterval(vehicleIntervalRef.current);
                      }
                      vehicleIntervalRef.current = setInterval(() => {
                        setCurrentVehicle((prev) => (prev + 1) % vehicles.length);
                      }, 4000);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentVehicle === index
                      ? theme === 'dark' ? 'bg-amber-400 w-8' : 'bg-blue-600 w-8'
                      : theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                      }`}
                  />
                ))}
              </div>

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
                  <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 group-hover:blur-2xl ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-400/30'
                    }`}></div>
                  <div className={`relative p-4 rounded-2xl backdrop-blur-sm transition-all duration-500 group-hover:scale-110 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/50'
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

            {/* Auth Card - Premium Glassmorphism 2.0 */}
            <div className={`relative rounded-3xl overflow-hidden animate-slide-up transition-all duration-500 group ${theme === 'dark'
              ? 'bg-slate-900/80 shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(251,191,36,0.1)]'
              : 'bg-white/90 shadow-[0_8px_40px_rgba(0,0,0,0.15),0_0_0_1px_rgba(251,191,36,0.1)]'
              }`}>
              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-amber-400/50 via-orange-500/20 to-amber-600/50 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Glass reflection overlay */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>

              {/* Inner glow */}
              <div className={`absolute inset-0 rounded-3xl pointer-events-none ${theme === 'dark'
                ? 'shadow-[inset_0_0_60px_rgba(251,191,36,0.05)]'
                : 'shadow-[inset_0_0_60px_rgba(251,191,36,0.03)]'
                }`} />

              {/* Card content with backdrop blur */}
              <div className={`relative rounded-3xl backdrop-blur-2xl border ${theme === 'dark'
                ? 'border-slate-700/50 bg-slate-900/60'
                : 'border-white/80 bg-white/80'
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
                            className={`flex-1 transition-all duration-300 ${activeTab === 'signin'
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
                            className={`flex-1 transition-all duration-300 ${activeTab === 'signup'
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
                              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                                }`} />
                              <Input
                                id="email-signin"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className={`pl-11 h-12 transition-all duration-300 rounded-xl ${theme === 'dark'
                                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
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
                              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                                }`} />
                              <Input
                                id="password-signin"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className={`pl-11 h-12 transition-all duration-300 rounded-xl ${theme === 'dark'
                                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Remember me & Forgot password */}
                          <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                className={`w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''
                                  }`}
                              />
                              <span className={`transition-colors ${theme === 'dark' ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-800'
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
                              <span className={`px-2 ${theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-500'
                                }`}>O continuar con</span>
                            </div>
                          </div>

                          {/* Google Sign In Button */}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              setLoading(true);
                              setError(null);
                              const { error } = await lovable.auth.signInWithOAuth("google", {
                                redirect_uri: window.location.origin,
                              });
                              if (error) {
                                setError(error.message || 'Error al iniciar sesión con Google');
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className={`w-full h-12 border-2 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group ${theme === 'dark'
                              ? 'border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-white'
                              : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                          >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {loading ? 'Conectando...' : 'Google'}
                          </Button>
                        </form>
                      </TabsContent>

                      {/* Sign Up Tab */}
                      <TabsContent value="signup" className="px-8 pb-8 space-y-4 mt-0">
                        <form onSubmit={handleSignUpStep1} className="space-y-4">
                          {/* Email Input */}
                          <div className="space-y-2">
                            <Label htmlFor="email-signup" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              Correo Electrónico
                            </Label>
                            <div className="relative group">
                              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                                }`} />
                              <Input
                                id="email-signup"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className={`pl-11 h-12 transition-all duration-300 rounded-xl ${theme === 'dark'
                                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Phone Input */}
                          <div className="space-y-2">
                            <Label htmlFor="phone" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              Teléfono
                            </Label>
                            <div className="relative group">
                              <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                                }`} />
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (809) 855-6302"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                disabled={loading}
                                className={`pl-11 h-12 transition-all duration-300 rounded-xl ${theme === 'dark'
                                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                                  }`}
                              />
                            </div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Recibirás un PIN por SMS para verificación</p>
                          </div>

                          {/* Password Input */}
                          <div className="space-y-2">
                            <Label htmlFor="password-signup" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              Contraseña
                            </Label>
                            <div className="relative group">
                              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                                }`} />
                              <Input
                                id="password-signup"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className={`pl-11 h-12 transition-all duration-300 rounded-xl ${theme === 'dark'
                                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Confirm Password Input */}
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              Confirmar Contraseña
                            </Label>
                            <div className="relative group">
                              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${theme === 'dark' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'
                                }`} />
                              <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className={`pl-11 h-12 transition-all duration-300 rounded-xl ${theme === 'dark'
                                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                                  }`}
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
                    <div className={`px-8 py-5 border-t ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
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
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                        }`}>
                        <Key className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                      </div>
                      <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Verificación PIN</h2>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Hemos enviado un código de verificación a<br />
                        <span className="font-semibold text-amber-500">{phone}</span>
                      </p>
                    </div>

                    <form onSubmit={handlePinVerification} className="space-y-4">
                      {/* PIN Input */}
                      <div className="space-y-2">
                        <Label htmlFor="pin" className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
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
                          className={`h-14 text-center text-3xl tracking-[0.5em] font-bold rounded-xl transition-all duration-300 ${theme === 'dark'
                            ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                            : 'bg-white border-slate-200 text-black placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                            }`}
                        />
                        {pinSent && (
                          <p className="text-xs text-green-500 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Código enviado exitosamente
                          </p>
                        )}
                      </div>

                      {/* Error Alert */}
                      {error && (
                        <Alert variant="destructive" className={`rounded-xl animate-shake ${theme === 'dark' ? 'bg-red-950/50 border-red-800' : 'bg-red-50 border-red-200'
                          }`}>
                          <AlertCircle className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                          <AlertDescription className={`text-sm ml-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Verify Button */}
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-semibold rounded-xl transition-all duration-500 shadow-lg shadow-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/60 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                        className={`w-full h-12 border-2 rounded-xl transition-all duration-300 ${theme === 'dark'
                          ? 'border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-white'
                          : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
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

        /* === NEW PREMIUM 3D ANIMATIONS === */
        
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-flow {
          animation: gradient-flow 15s ease infinite;
        }
        
        @keyframes orb-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% { 
            transform: translate(30px, -20px) scale(1.05);
            opacity: 0.8;
          }
          50% { 
            transform: translate(-20px, 30px) scale(0.95);
            opacity: 0.5;
          }
          75% { 
            transform: translate(-30px, -10px) scale(1.02);
            opacity: 0.7;
          }
        }
        
        .animate-orb-float {
          animation: orb-float 20s ease-in-out infinite;
        }
        
        .animate-orb-float-delayed {
          animation: orb-float 25s ease-in-out infinite;
          animation-delay: 5s;
        }
        
        @keyframes orb-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.4;
          }
          50% { 
            transform: scale(1.15);
            opacity: 0.6;
          }
        }
        
        .animate-orb-pulse {
          animation: orb-pulse 8s ease-in-out infinite;
        }
        
        @keyframes orb-3d {
          0%, 100% { 
            transform: translateY(0) translateX(0) scale(1);
            filter: blur(0px);
          }
          25% { 
            transform: translateY(-30px) translateX(20px) scale(1.1);
            filter: blur(1px);
          }
          50% { 
            transform: translateY(-10px) translateX(-30px) scale(0.9);
            filter: blur(2px);
          }
          75% { 
            transform: translateY(-40px) translateX(10px) scale(1.05);
            filter: blur(0.5px);
          }
        }
        
        .animate-orb-3d {
          animation: orb-3d 12s ease-in-out infinite;
        }
        
        @keyframes particle-float {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.6;
          }
          33% { 
            transform: translateY(-50px) translateX(30px) rotate(120deg);
            opacity: 1;
          }
          66% { 
            transform: translateY(-20px) translateX(-20px) rotate(240deg);
            opacity: 0.8;
          }
        }
        
        .animate-particle-float {
          animation: particle-float 10s ease-in-out infinite;
        }
        
        /* Mesh gradient backgrounds */
        .bg-gradient-mesh-dark {
          background-image: 
            radial-gradient(at 40% 20%, rgba(251, 191, 36, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(249, 115, 22, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(234, 179, 8, 0.06) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(251, 146, 60, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.1) 0px, transparent 50%);
        }
        
        .bg-gradient-mesh-light {
          background-image: 
            radial-gradient(at 40% 20%, rgba(251, 191, 36, 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(249, 115, 22, 0.12) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(234, 179, 8, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(251, 146, 60, 0.12) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.15) 0px, transparent 50%);
        }
        
        /* Radial gradient utility */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
        
        /* 3D Card tilt effect styles */
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }
        
        .card-3d-inner {
          transform: translateZ(50px);
        }
        
        /* Glass reflection */
        .glass-reflection {
          position: relative;
          overflow: hidden;
        }
        
        .glass-reflection::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.7s ease;
        }
        
        .glass-reflection:hover::before {
          left: 100%;
        }
        
        /* Glow border animation */
        @keyframes border-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.4), 0 0 60px rgba(249, 115, 22, 0.2);
          }
        }
        
        .animate-border-glow {
          animation: border-glow 3s ease-in-out infinite;
        }
        
        /* Vehicle 3D transition */
        @keyframes vehicle-enter {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateY(-30deg) translateX(-50px);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateY(0deg) translateX(0);
          }
        }
        
        .animate-vehicle-enter {
          animation: vehicle-enter 0.8s ease-out;
        }
        
        /* Shimmer effect for buttons */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
