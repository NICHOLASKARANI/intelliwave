'use client'

import { motion } from 'framer-motion'
import { Code2, GitBranch, Terminal, Database, Cloud, Cpu } from 'lucide-react'

const codeSnippets = [
  { text: 'AIEngine.deploy()', icon: Cpu, color: 'from-blue-500 to-cyan-500', delay: 0 },
  { text: 'CloudInfra.scale()', icon: Cloud, color: 'from-purple-500 to-pink-500', delay: 1 },
  { text: 'Database.query()', icon: Database, color: 'from-green-500 to-emerald-500', delay: 2 },
  { text: 'Git.push()', icon: GitBranch, color: 'from-orange-500 to-red-500', delay: 3 },
  { text: 'npm run build', icon: Terminal, color: 'from-yellow-500 to-orange-500', delay: 4 },
  { text: '<CodeReview />', icon: Code2, color: 'from-cyan-500 to-blue-500', delay: 5 },
]

export function CodingAnimation() {
  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-gray-700 bg-gradient-to-br from-gray-900 via-gray-950 to-black shadow-2xl">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 102, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 102, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Animated Code Lines Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            style={{ top: `${15 + i * 15}%`, left: 0, right: 0 }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Center Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        {/* Main Terminal Icon */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
            <Terminal className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Floating Code Snippets */}
        <div className="relative w-full max-w-sm">
          {codeSnippets.map((snippet) => {
            const Icon = snippet.icon
            return (
              <motion.div
                key={snippet.text}
                className="absolute flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-lg"
                style={{
                  top: `${-120 + snippet.delay * 35}px`,
                  left: `${snippet.delay % 2 === 0 ? -20 : 60}%`,
                }}
                animate={{
                  y: [0, -10, 0],
                  x: [0, snippet.delay % 2 === 0 ? 10 : -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: snippet.delay * 0.3,
                  ease: 'easeInOut',
                }}
              >
                <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${snippet.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-mono text-gray-300">{snippet.text}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 text-center"
        >
          <p className="text-gray-400 font-mono text-sm mb-1">
            <span className="text-green-400">$</span> intelliwave deploy --production
          </p>
          <p className="text-green-400 font-mono text-xs">
            ✓ Build completed successfully
          </p>
          <p className="text-green-400 font-mono text-xs">
            ✓ Deployed to global edge network
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">System Online</span>
          </div>
        </motion.div>
      </div>

      {/* Corner Glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
    </div>
  )
}