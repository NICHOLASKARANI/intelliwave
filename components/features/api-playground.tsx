'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Play, Copy, Check, Code2 } from 'lucide-react'

const endpoints = [
  { method: 'GET', path: '/api/v1/ai/predict', desc: 'AI Prediction Endpoint' },
  { method: 'POST', path: '/api/v1/projects/create', desc: 'Create New Project' },
  { method: 'GET', path: '/api/v1/analytics/dashboard', desc: 'Get Analytics Data' },
]

const mockResponses: Record<string, string> = {
  '/api/v1/ai/predict': JSON.stringify(
    {
      status: 200,
      data: {
        prediction: 'High Growth Potential',
        confidence: 0.97,
        recommended_action: 'Scale infrastructure',
        estimated_roi: '340%',
      },
      timestamp: new Date().toISOString(),
    },
    null,
    2
  ),
  '/api/v1/projects/create': JSON.stringify(
    {
      status: 201,
      data: {
        project_id: 'proj_8xK2mN9p',
        status: 'created',
        team_assigned: true,
        estimated_completion: '2024-03-15',
      },
    },
    null,
    2
  ),
  '/api/v1/analytics/dashboard': JSON.stringify(
    {
      status: 200,
      data: {
        active_users: 450000,
        projects_completed: 10000,
        uptime_percentage: 99.99,
        revenue_growth: '+156%',
      },
    },
    null,
    2
  ),
}

export function APIPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0])
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const sendRequest = () => {
    setIsLoading(true)
    setResponse('')
    setTimeout(() => {
      setResponse(mockResponses[selectedEndpoint.path] || '{}')
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <Terminal className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">API Playground</h3>
          <p className="text-sm text-muted-foreground">Test our APIs directly in your browser</p>
        </div>
      </div>

      {/* Endpoint Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {endpoints.map((endpoint) => (
          <button
            key={endpoint.path}
            onClick={() => {
              setSelectedEndpoint(endpoint)
              setResponse('')
            }}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              selectedEndpoint.path === endpoint.path
                ? 'bg-primary text-white'
                : 'bg-muted/50 hover:bg-muted border'
            }`}
          >
            <span
              className={`font-bold ${
                endpoint.method === 'GET'
                  ? 'text-green-400'
                  : endpoint.method === 'POST'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}
            >
              {endpoint.method}
            </span>{' '}
            {endpoint.path}
          </button>
        ))}
      </div>

      {/* Request Bar */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-black/90 rounded-xl border border-gray-700">
        <span className="text-green-400 font-mono text-sm font-bold">
          {selectedEndpoint.method}
        </span>
        <span className="text-white font-mono text-sm flex-1">
          {selectedEndpoint.path}
        </span>
        <button
          onClick={sendRequest}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Code2 className="w-4 h-4" />
            </motion.div>
          ) : (
            <Play className="w-4 h-4" />
          )}
          Send
        </button>
      </div>

      {/* Response Area */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Response</span>
          {response && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(response)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        <pre className="bg-black/90 text-green-400 p-6 rounded-xl text-xs md:text-sm overflow-auto max-h-64 border border-gray-700 min-h-[100px]">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : response ? (
            <code>{response}</code>
          ) : (
            <span className="text-gray-600">Click "Send" to test the endpoint</span>
          )}
        </pre>
      </div>
    </div>
  )
}