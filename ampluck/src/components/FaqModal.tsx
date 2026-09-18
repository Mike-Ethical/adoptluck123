import React from 'react';
import { X, HelpCircle, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const faqs = [
    {
      q: 'What is AdmLuck?',
      a: 'AdmLuck is a provably fair coinflip platform specifically built for Roblox Adopt Me pet enthusiasts. Players can deposit internal platform pets, challenge other players to 50/50 coinflips, and win full pet pots.',
    },
    {
      q: 'How does Roblox verification work?',
      a: 'AdmLuck strictly adheres to Roblox safety guidelines. We will NEVER ask for your password, cookies (.ROBLOSECURITY), or 2FA credentials. You simply place a temporary verification phrase in your Roblox profile About section to confirm ownership.',
    },
    {
      q: 'How does in-game Adopt Me delivery work?',
      a: 'The platform inventory is an internal game balance. Delivery requires a legitimate in-game Roblox trade with verified trade bots or delivery operators in accordance with Roblox Terms of Service.',
    },
    {
      q: 'How is the coinflip provably fair?',
      a: 'Before any flip occurs, the server commits to a secret random 256-bit server seed and generates an unchangeable SHA-256 hash. Once settled, the server seed is revealed so you can independently verify that the outcome was never manipulated.',
    },
    {
      q: 'Where do pet values come from?',
      a: 'Values are referenced from community Adopt Me trading value lists (AMVGG values). Neon, Mega, Fly, and Ride modifiers automatically scale pet values mathematically.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0e131d] border border-[#202c42] rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              Frequently Asked Questions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-[#111724] border border-[#1c263a] rounded-xl space-y-1.5">
              <h3 className="font-gaming font-bold text-white text-sm tracking-wide">
                {faq.q}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
