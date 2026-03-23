import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Lock, Radio, FolderOpen, Github, Moon, Sun,
  ArrowRight, CheckCircle, ChevronRight, Globe, Shield, Infinity
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
}

function Navbar({ darkMode, setDarkMode, onGetStarted }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="glass dark:glass-dark rounded-2xl px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Locify" className="w-8 h-8 rounded-xl shadow" />
            <span className="text-lg font-bold text-[#0F172A] dark:text-white tracking-tight">Locify</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Docs'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                className="text-sm font-medium text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                {item}
              </a>
            ))}
            <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors">
              <Github size={16} /> GitHub
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={onGetStarted}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-semibold px-5 py-2 rounded-full shadow transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass dark:glass-dark rounded-2xl p-4 shadow-md flex items-center gap-3 min-w-[160px]"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium">{label}</div>
        <div className="text-sm font-bold text-[#0F172A] dark:text-white">{value}</div>
      </div>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, description, color, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-md border border-slate-100 dark:border-slate-700 flex flex-col gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{title}</h3>
      <p className="text-[#64748B] dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

function StepCard({ number, title, description, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="flex flex-col items-center text-center gap-4"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#22C55E] to-[#3B82F6] flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {number}
        </div>
        {number < 3 && (
          <div className="absolute top-7 left-14 w-16 md:w-32 h-0.5 bg-gradient-to-r from-[#22C55E]/40 to-[#3B82F6]/40 hidden md:block" />
        )}
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{title}</h3>
      <p className="text-[#64748B] dark:text-slate-400 text-sm max-w-[200px]">{description}</p>
    </motion.div>
  )
}

export default function HomePage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()

  const heroCards = [
    { icon: Zap, label: 'Transfer Speed', value: 'Lightning Fast', color: 'bg-yellow-400', delay: 0 },
    { icon: Lock, label: 'Security', value: 'End-to-End', color: 'bg-[#22C55E]', delay: 1 },
    { icon: Radio, label: 'Connection', value: 'Peer-to-Peer', color: 'bg-[#3B82F6]', delay: 2 },
    { icon: FolderOpen, label: 'File Size', value: 'Unlimited', color: 'bg-purple-500', delay: 3 },
  ]

  const features = [
    {
      icon: Globe,
      title: 'Direct Browser Connection',
      description: 'Files travel directly between browsers using WebRTC — no intermediary servers, no bottlenecks.',
      color: 'bg-[#3B82F6]',
      delay: 0,
    },
    {
      icon: Shield,
      title: 'No Cloud Storage',
      description: 'Your files never touch our servers. Complete privacy with zero data retention on any cloud.',
      color: 'bg-[#22C55E]',
      delay: 1,
    },
    {
      icon: Infinity,
      title: 'Unlimited File Size',
      description: 'Send files of any size — from small documents to large video files — without artificial limits.',
      color: 'bg-purple-500',
      delay: 2,
    },
  ]

  const steps = [
    { number: 1, title: 'Create Room', description: 'Open a secure P2P room in one click.' },
    { number: 2, title: 'Share Link', description: 'Send the room link to your recipient.' },
    { number: 3, title: 'Send Files', description: 'Drop files and they transfer instantly.' },
  ]

  return (
    <div className="min-h-screen bg-page-gradient dark:bg-dark-gradient text-[#0F172A] dark:text-white">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} onGetStarted={() => navigate('/dashboard')} />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left */}
            <div className="flex-1 flex flex-col gap-6">
              <motion.div
                variants={fadeUp} custom={0} initial="hidden" animate="visible"
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 text-sm font-medium text-[#3B82F6] w-fit shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                Instant P2P File Sharing
              </motion.div>

              <motion.h1
                variants={fadeUp} custom={1} initial="hidden" animate="visible"
                className="text-5xl md:text-6xl font-extrabold leading-tight text-[#0F172A] dark:text-white"
              >
                Share Files
                <span className="block bg-gradient-to-r from-[#22C55E] to-[#3B82F6] bg-clip-text text-transparent">
                  Instantly
                </span>
                Without Uploading<br />to Servers
              </motion.h1>

              <motion.p
                variants={fadeUp} custom={2} initial="hidden" animate="visible"
                className="text-lg text-[#475569] dark:text-slate-400 max-w-md leading-relaxed"
              >
                Direct peer-to-peer file transfer — fast, secure, and completely private. No accounts, no cloud, no limits.
              </motion.p>

              <motion.div
                variants={fadeUp} custom={3} initial="hidden" animate="visible"
                className="flex flex-wrap gap-3"
              >
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-7 py-3.5 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Room <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white font-semibold px-7 py-3.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Join Room
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp} custom={4} initial="hidden" animate="visible"
                className="flex flex-wrap gap-4 pt-2"
              >
                {['No signup required', 'End-to-end encrypted', '100% Free'].map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-slate-400">
                    <CheckCircle size={14} className="text-[#22C55E]" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — floating cards */}
            <div className="flex-1 relative w-full max-w-md">
              {/* Main visual card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-[#0F172A] dark:text-white">Active Transfer</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-[#22C55E] font-semibold px-3 py-1 rounded-full">Live</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FolderOpen size={20} className="text-[#3B82F6]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A] dark:text-white">project_final.zip</div>
                    <div className="text-xs text-[#64748B]">2.4 GB • 3 files</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-[#22C55E] to-[#3B82F6] h-2.5 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '68%' }}
                    transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#64748B] mb-4">
                  <span>68% complete</span>
                  <span>12.3 MB/s</span>
                </div>
                <div className="flex items-center gap-2">
                  {['A', 'B'].map((l, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'}`}>
                      {l}
                    </div>
                  ))}
                  <div className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-[#22C55E] to-[#3B82F6] rounded-full relative overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 w-4 h-full bg-white/60 rounded-full"
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  <span className="text-xs text-[#64748B]">P2P</span>
                </div>
              </motion.div>

              {/* Floating mini cards */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {heroCards.map(card => (
                  <HeroCard key={card.label} {...card} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-[#0F172A] dark:text-white mb-4">
              Why Locify is{' '}
              <span className="bg-gradient-to-r from-[#22C55E] to-[#3B82F6] bg-clip-text text-transparent">
                Faster
              </span>
            </h2>
            <p className="text-[#475569] dark:text-slate-400 max-w-xl mx-auto">
              Built on WebRTC technology — the same standard powering modern video calls — for blazing-fast direct transfers.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/50 dark:bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold text-[#0F172A] dark:text-white mb-4">How It Works</h2>
            <p className="text-[#475569] dark:text-slate-400 max-w-xl mx-auto">
              Three simple steps to start sending files directly to anyone, anywhere.
            </p>
          </motion.div>
          <div className="flex flex-col md:flex-row items-start justify-center gap-12 md:gap-0">
            {steps.map((step, i) => (
              <React.Fragment key={step.number}>
                <StepCard {...step} delay={i} />
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-16 mt-7">
                    <ChevronRight size={24} className="text-slate-300 dark:text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="bg-gradient-to-br from-[#22C55E]/10 to-[#3B82F6]/10 border border-slate-200 dark:border-slate-700 rounded-3xl p-14 shadow-xl"
          >
            <h2 className="text-4xl font-extrabold text-[#0F172A] dark:text-white mb-4">
              Start Sharing Files
            </h2>
            <p className="text-[#475569] dark:text-slate-400 mb-8 text-lg">
              No signup. No cloud. Completely private. Open a room and start sharing in seconds.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 mx-auto bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold px-10 py-4 rounded-full shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 text-lg"
            >
              Open Room <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Locify" className="w-6 h-6 rounded-lg shadow" />
            <span className="font-bold text-[#0F172A] dark:text-white">Locify</span>
          </div>
          <p className="text-sm text-[#64748B]">© 2026 Locify. Instant P2P File Sharing.</p>
          <div className="flex gap-5 text-sm text-[#64748B]">
            <a href="#" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
