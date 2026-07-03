import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LoginModal from '../components/LoginModal';

const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<{
    amount: string;
    paymentId: string;
    orderId: string;
    date: string;
    plan: string;
  } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  // Handle URL params for cross-domain payment routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const plan = params.get('plan');
    const isRedirectBack = params.get('redirectBack') === 'true';
    const isPaymentSuccess = params.get('payment') === 'success';

    if (isPaymentSuccess) {
      checkAuth();
      // Optionally show a generic success message or modal, though checking auth updates UI to premium.
    }

    if (token && refreshToken && plan && isRedirectBack) {
      // Temporarily set auth so the request works
      // We don't have user object easily, so we just set tokens in local storage manually,
      // or we can just patch useAuthStore state directly, but setAuth expects user.
      // Easiest hack for immediate Razorpay popup without full user fetch:
      useAuthStore.setState({ accessToken: token, refreshToken: refreshToken, isAuthenticated: true });
      
      // We still need user data for Razorpay prefill, let's fetch it quickly using checkAuth
      checkAuth().then(() => {
        handlePayment(plan, true);
      });
      
      // Clean up URL to hide tokens
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const downloadReceiptPDF = async () => {
    if (!receiptRef.current) return;
    try {
      // Temporarily remove rounded corners for clean PDF edges if needed, but it's fine
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#15171B', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Vibelly_Receipt_${receiptData?.paymentId}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF');
    }
  };

  const initiatePayment = (planPrice: string) => {
    if (user?.premiumStatus && user?.premiumExpiryDate) {
      setSelectedPlanPrice(planPrice);
    } else {
      handlePayment(planPrice);
    }
  };

  const handlePayment = async (planPriceStr: string, fromRedirect = false) => {
    if (!isAuthenticated && !fromRedirect) {
      setIsLoginModalOpen(true);
      return;
    }

    // Cross-Domain Bridging Logic
    const hostname = window.location.hostname;
    // If we are on vibelly.fun (restricted), bounce them to vercel.app
    if (!fromRedirect && (hostname === 'vibelly.fun' || hostname === 'www.vibelly.fun' || hostname === 'test-vibelly.fun')) {
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (accessToken && refreshToken) {
        window.location.href = `https://vibelly.vercel.app/pricing?token=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&plan=${encodeURIComponent(planPriceStr)}&redirectBack=true`;
        return;
      }
    }

    // Extract raw number, e.g., '₹1199' -> 1199
    const amount = parseInt(planPriceStr.replace(/[^0-9]/g, ''));
    if (amount === 0) return; // Free plan logic if needed

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      let token = useAuthStore.getState().accessToken;
      let orderRes = await fetch(`${backendUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (orderRes.status === 401) {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const refreshRes = await fetch(`${backendUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            useAuthStore.getState().setAuth(user!, data.accessToken, data.refreshToken);
            token = data.accessToken;
            orderRes = await fetch(`${backendUrl}/api/payment/create-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ amount })
            });
          } else {
            useAuthStore.getState().logout();
            navigate('/');
            return;
          }
        } else {
          useAuthStore.getState().logout();
          navigate('/');
          return;
        }
      }

      const orderData = await orderRes.json();

      if (!orderData.id) {
        console.error("Order Data Error:", orderData);
        alert(`Server error: ${orderData.error || 'Please try again'}`);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use Razorpay Key ID from env
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vibelly Premium',
        description: 'Upgrade to Vibelly Premium',
        order_id: orderData.id,
        handler: async function (response: any) {
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };

          const verifyRes = await fetch(`${backendUrl}/api/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(verifyData)
          }).then(r => r.json());

          if (verifyRes.success) {
            await checkAuth(); // Refresh user state to show premium status
            
            // If this was a cross-domain redirect, bounce back to vibelly.fun immediately
            if (fromRedirect || window.location.search.includes('redirectBack=true')) {
               window.location.href = 'https://vibelly.fun/pricing?payment=success';
               return;
            }

            setReceiptData({
              amount: planPriceStr,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              date: new Date().toLocaleString(),
              plan: planPriceStr === '₹499' ? 'Premium (Annual)' : planPriceStr === '₹49' ? 'Premium (Monthly)' : 'Premium (Daily)'
            });
          } else {
            alert('Payment Verification Failed!');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: ''
        },
        theme: {
          color: '#1A1A1A'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert('Failed to initiate payment.');
    }
  };

  const plans = [
    {
      name: 'Free',
      subtitle: 'Perfect for getting started',
      price: 'Free',
      period: '',
      highlight: false,
      buttonText: 'Start free',
      features: [
        'Standard matchmaking',
        'Standard video (480p)',
        'Unlimited sessions',
        'Basic reporting',
      ],
    },
    {
      name: 'Premium',
      subtitle: 'For the ultimate experience',
      price: isAnnual ? '₹499' : '₹49',
      period: isAnnual ? '/year' : '/month',
      highlight: true,
      buttonText: 'Get started',
      features: [
        'Everything in Free, plus:',
        'Opposite gender matching',
        'HD video calls (720p & 1080p)',
        'Random audio calling',
        'Real-time chat',
        'Country filters',
        'Interest matching',
        'Unlimited skips',
      ],
    },
    {
      name: 'Daily',
      subtitle: 'Try premium for a day',
      price: '₹9',
      period: '/day',
      highlight: false,
      buttonText: 'Get started',
      features: [
        'Everything in Premium',
        '24 hours of access',
        'Perfect for testing',
        'No commitment',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#15171B] text-white font-sans flex flex-col relative">
      <SEO 
        title="Vibelly Premium | Enhance Your Random Chat Experience" 
        description="Upgrade to Vibelly Premium for an ad-free experience, priority matchmaking, and exclusive badges."
        canonicalUrl="/pricing"
      />
      {/* ─── Dot Grid ─── */}
      <BlinkingDotsGrid />

      <div className="relative z-10 w-full flex flex-col items-center">
        <Navbar />
      </div>

      <main className="flex-1 flex flex-col items-center pt-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Connect instantly with anyone, anywhere. Pay only for premium features. Save on longer plans.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-16"
        >
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-zinc-800 relative transition-colors border border-white/5"
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-zinc-400 transition-all ${isAnnual ? 'right-0.5' : 'left-0.5'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>Annual</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Save 37%</span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-32">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`relative bg-[#1A1A1A] rounded-2xl p-8 border ${
                plan.highlight ? 'border-white md:scale-105 z-10 shadow-2xl' : 'border-white/10'
              } flex flex-col`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-zinc-400 h-10">{plan.subtitle}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white">{plan.name}</h2>
              </div>

              {plan.name === 'Free' && (
                 <div className="w-full bg-zinc-800/50 border border-white/5 text-center text-sm font-medium py-3 rounded-lg mb-8">
                   Always Free
                 </div>
              )}

              {plan.name === 'Premium' && (
                 <div className="mb-8">
                   <p className="text-xs text-zinc-500 mb-2">Choose your billing:</p>
                   <div className="w-full bg-zinc-800/50 border border-white/5 px-4 py-3 rounded-lg flex justify-between items-center text-sm">
                     <span>{isAnnual ? 'Billed annually' : 'Billed monthly'}</span>
                   </div>
                   <div className="mt-4 flex items-end gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-zinc-500 text-sm mb-1">{plan.period}</span>
                   </div>
                 </div>
              )}

              {plan.name === 'Daily' && (
                 <div className="mb-8">
                    <p className="text-xs text-zinc-500 mb-2">Billed once for 24 hours</p>
                   <div className="mt-4 flex items-end gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-zinc-500 text-sm mb-1">{plan.period}</span>
                   </div>
                 </div>
              )}

              <div className="flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check size={16} className="text-white shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  if (plan.price === 'Free') {
                    navigate('/');
                  } else {
                    initiatePayment(plan.price);
                  }
                }}
                className={`w-full mt-10 py-3 rounded-xl font-medium transition-colors ${
                  plan.highlight 
                    ? 'bg-white text-black hover:bg-zinc-200' 
                    : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Active Subscription Modal */}
      {selectedPlanPrice && user?.premiumExpiryDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#15171B] border border-white/30 rounded-[2rem] overflow-hidden shadow-2xl relative p-8 text-center"
          >
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-white w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Active Premium!</h2>
            <p className="text-sm text-zinc-400 mb-6">
              You already have an active Premium subscription with <strong className="text-white">{Math.max(0, Math.ceil((new Date(user.premiumExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days</strong> remaining.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  const priceToPay = selectedPlanPrice;
                  setSelectedPlanPrice(null);
                  handlePayment(priceToPay);
                }}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-white/20"
              >
                Proceed & Add Extra Days
              </button>
              <button
                onClick={() => setSelectedPlanPrice(null)}
                className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#15171B] border border-white/20 rounded-3xl overflow-hidden shadow-2xl relative"
          >
            {/* The printable receipt area */}
            <div ref={receiptRef} className="p-8 bg-[#15171B] relative">
              <div className="flex flex-col items-center mb-6 border-b border-white/10 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <span className="text-black font-bold text-2xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>V</span>
                  </div>
                  <span className="text-white font-bold text-2xl tracking-wide" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    Vibelly
                  </span>
                </div>
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                  <Check className="text-green-500 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Payment Successful</h2>
                <p className="text-zinc-400 text-sm">Thank you for your purchase!</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Plan</span>
                  <span className="text-white font-semibold">{receiptData.plan}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Amount Paid</span>
                  <span className="text-white font-bold text-lg">{receiptData.amount}</span>
                </div>
                <div className="h-px w-full bg-white/10 my-2 border-dashed border-t" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Date</span>
                  <span className="text-zinc-300">{receiptData.date}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Order ID</span>
                  <span className="text-zinc-300 font-mono">{receiptData.orderId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Transaction ID</span>
                  <span className="text-zinc-300 font-mono">{receiptData.paymentId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Account</span>
                  <span className="text-zinc-300">{user?.email || user?.username}</span>
                </div>
              </div>
              
              {/* Optional footer note for PDF */}
              <div className="mt-8 text-center text-[10px] text-zinc-600">
                <p>This is a computer generated receipt and requires no signature.</p>
                <p>Vibelly Premium Services</p>
              </div>
            </div>

            {/* Action Buttons (Not included in PDF capture) */}
            <div className="p-6 bg-[#0A0A0A] border-t border-white/5 space-y-3">
              <button
                onClick={downloadReceiptPDF}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <Download size={18} />
                Download Receipt (PDF)
              </button>
              <button
                onClick={() => {
                  setReceiptData(null);
                  navigate('/');
                }}
                className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      
      <Footer />
    </div>
  );
}
