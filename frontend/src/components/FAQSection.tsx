import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  subtitle?: string;
}

export default function FAQSection({ faqs, title = "Frequently Asked Questions", subtitle = "Everything you need to know about Vibelly." }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };


  return (
    <section className="py-24 bg-[#111316] relative border-t border-white/5">

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
            {title}
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`rounded-2xl border transition-all duration-300 ${openIndex === index ? 'bg-white/10 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none"
                onClick={() => toggleFaq(index)}
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                <div className={`p-2 rounded-full bg-white/5 transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180 bg-blue-500/20 text-blue-400' : 'text-zinc-400'}`}>
                  <ChevronDown size={20} />
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
