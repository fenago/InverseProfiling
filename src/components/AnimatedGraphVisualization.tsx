/**
 * AnimatedGraphVisualization.tsx
 * Dynamic, force-directed graph visualization with animated particle flow
 * for the LevelGraph knowledge graph
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Network, ZoomIn, ZoomOut, Maximize2, Play, Pause, RefreshCw } from 'lucide-react'

interface Triple {
  subject: string
  predicate: string
  object: string
  metadata?: Record<string, unknown>
}

interface GraphNode {
  id: string
  type: 'subject' | 'object'
  connections: number
  x: number
  y: number
  vx: number
  vy: number
  fx?: number | null
  fy?: number | null
}

interface GraphEdge {
  source: string
  target: string
  label: string
  metadata?: Record<string, unknown>
  particles: Particle[]
}

interface Particle {
  progress: number
  speed: number
  size: number
}

interface Props {
  triples: Triple[]
  width?: number
  height?: number
}

// Force simulation parameters
const FORCE_CONFIG = {
  repulsion: 800,
  attraction: 0.05,
  centerGravity: 0.02,
  damping: 0.85,
  minDistance: 60,
  maxVelocity: 5,
}

export default function AnimatedGraphVisualization({ triples, width = 900, height = 600 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const animationRef = useRef<number>(0)
  const [isSimulating, setIsSimulating] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null)
  const [nodes, setNodes] = useState<Map<string, GraphNode>>(new Map())
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [tick, setTick] = useState(0)

  // Parse triples into nodes and edges
  useEffect(() => {
    if (!triples || triples.length === 0) return

    const nodeMap = new Map<string, GraphNode>()
    const edgeList: GraphEdge[] = []
    const centerX = width / 2
    const centerY = height / 2

    triples.forEach((triple, idx) => {
      // Add subject node
      if (!nodeMap.has(triple.subject)) {
        const angle = (2 * Math.PI * idx) / Math.min(triples.length, 50)
        const radius = 150 + Math.random() * 100
        nodeMap.set(triple.subject, {
          id: triple.subject,
          type: 'subject',
          connections: 0,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        })
      }
      nodeMap.get(triple.subject)!.connections++

      // Add object node
      if (!nodeMap.has(triple.object)) {
        const angle = (2 * Math.PI * (idx + 0.5)) / Math.min(triples.length, 50)
        const radius = 150 + Math.random() * 100
        nodeMap.set(triple.object, {
          id: triple.object,
          type: 'object',
          connections: 0,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        })
      }
      nodeMap.get(triple.object)!.connections++

      // Create particles for this edge
      const particles: Particle[] = []
      const numParticles = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          progress: Math.random(),
          speed: 0.002 + Math.random() * 0.003,
          size: 2 + Math.random() * 2,
        })
      }

      edgeList.push({
        source: triple.subject,
        target: triple.object,
        label: triple.predicate,
        metadata: triple.metadata,
        particles,
      })
    })

    setNodes(nodeMap)
    setEdges(edgeList)
  }, [triples, width, height])

  // Force simulation physics
  const simulateForces = useCallback(() => {
    if (!isSimulating || nodes.size === 0) return

    setNodes(prevNodes => {
      const newNodes = new Map(prevNodes)
      const nodeArray = Array.from(newNodes.values())
      const centerX = width / 2
      const centerY = height / 2

      // Apply forces to each node
      nodeArray.forEach(node => {
        if (node.fx !== undefined && node.fx !== null) {
          node.x = node.fx
          node.y = node.fy!
          node.vx = 0
          node.vy = 0
          return
        }

        let fx = 0
        let fy = 0

        // Repulsion from other nodes
        nodeArray.forEach(other => {
          if (other.id === node.id) return
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < FORCE_CONFIG.minDistance * 3) {
            const force = FORCE_CONFIG.repulsion / (dist * dist)
            fx += (dx / dist) * force
            fy += (dy / dist) * force
          }
        })

        // Attraction along edges
        edges.forEach(edge => {
          if (edge.source === node.id || edge.target === node.id) {
            const otherId = edge.source === node.id ? edge.target : edge.source
            const other = newNodes.get(otherId)
            if (other) {
              const dx = other.x - node.x
              const dy = other.y - node.y
              fx += dx * FORCE_CONFIG.attraction
              fy += dy * FORCE_CONFIG.attraction
            }
          }
        })

        // Center gravity
        fx += (centerX - node.x) * FORCE_CONFIG.centerGravity
        fy += (centerY - node.y) * FORCE_CONFIG.centerGravity

        // Update velocity with damping
        node.vx = (node.vx + fx) * FORCE_CONFIG.damping
        node.vy = (node.vy + fy) * FORCE_CONFIG.damping

        // Clamp velocity
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
        if (speed > FORCE_CONFIG.maxVelocity) {
          node.vx = (node.vx / speed) * FORCE_CONFIG.maxVelocity
          node.vy = (node.vy / speed) * FORCE_CONFIG.maxVelocity
        }

        // Update position
        node.x += node.vx
        node.y += node.vy

        // Keep within bounds
        node.x = Math.max(50, Math.min(width - 50, node.x))
        node.y = Math.max(50, Math.min(height - 50, node.y))
      })

      return newNodes
    })

    // Update particles
    setEdges(prevEdges =>
      prevEdges.map(edge => ({
        ...edge,
        particles: edge.particles.map(p => ({
          ...p,
          progress: (p.progress + p.speed) % 1,
        })),
      }))
    )

    setTick(t => t + 1)
  }, [isSimulating, nodes.size, edges, width, height])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      simulateForces()
      animationRef.current = requestAnimationFrame(animate)
    }

    if (isSimulating) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSimulating, simulateForces])

  // Node dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setDraggedNode(nodeId)
    setNodes(prev => {
      const newNodes = new Map(prev)
      const node = newNodes.get(nodeId)
      if (node) {
        node.fx = node.x
        node.fy = node.y
      }
      return newNodes
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNode) {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      setNodes(prev => {
        const newNodes = new Map(prev)
        const node = newNodes.get(draggedNode)
        if (node) {
          node.x = x
          node.y = y
          node.fx = x
          node.fy = y
        }
        return newNodes
      })
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }, [draggedNode, isPanning, panStart, pan, zoom])

  const handleMouseUp = useCallback(() => {
    if (draggedNode) {
      setNodes(prev => {
        const newNodes = new Map(prev)
        const node = newNodes.get(draggedNode)
        if (node) {
          node.fx = null
          node.fy = null
        }
        return newNodes
      })
      setDraggedNode(null)
    }
    setIsPanning(false)
  }, [draggedNode])

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  // Reset simulation
  const resetSimulation = useCallback(() => {
    const centerX = width / 2
    const centerY = height / 2
    setNodes(prev => {
      const newNodes = new Map(prev)
      let i = 0
      newNodes.forEach(node => {
        const angle = (2 * Math.PI * i) / newNodes.size
        const radius = 150 + Math.random() * 100
        node.x = centerX + Math.cos(angle) * radius
        node.y = centerY + Math.sin(angle) * radius
        node.vx = 0
        node.vy = 0
        node.fx = null
        node.fy = null
        i++
      })
      return newNodes
    })
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }, [width, height])

  // Color helpers
  const getNodeColor = useCallback((nodeId: string) => {
    if (nodeId.startsWith('user:')) return '#3b82f6'
    if (nodeId.startsWith('topic:')) return '#8b5cf6'
    if (nodeId.startsWith('domain:')) return '#10b981'
    if (nodeId.startsWith('concept:')) return '#f59e0b'
    if (nodeId.startsWith('session:')) return '#ec4899'
    return '#6b7280'
  }, [])

  const getEdgeColor = useCallback((predicate: string) => {
    if (predicate === 'discusses' || predicate === 'interested_in') return '#3b82f6'
    if (predicate === 'belongs_to_domain') return '#10b981'
    if (predicate === 'correlates_with' || predicate === 'indicates') return '#8b5cf6'
    if (predicate === 'similar_to' || predicate === 'related_to') return '#f59e0b'
    if (predicate === 'mentioned_in' || predicate === 'has_message') return '#ec4899'
    return '#9ca3af'
  }, [])

  // Memoized node array for rendering
  const nodeArray = useMemo(() => Array.from(nodes.values()), [nodes, tick])

  if (!triples || triples.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg">
        <Network className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No Graph Data</p>
        <p className="text-sm">Start chatting to build your knowledge graph!</p>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`p-2 rounded-lg transition-all ${
            isSimulating
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title={isSimulating ? 'Pause simulation' : 'Start simulation'}
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={resetSimulation}
          className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all"
          title="Reset layout"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
          className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
          className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-all"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 text-xs z-20">
        <div className="font-medium text-white mb-2">Node Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-gray-300">User</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-gray-300">Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-gray-300">Domain</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-gray-300">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></span>
            <span className="text-gray-300">Session</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 text-xs z-20">
        <div className="text-white font-medium">{nodeArray.length} nodes</div>
        <div className="text-gray-400">{edges.length} edges</div>
        <div className="text-gray-500">{isSimulating ? 'Simulating...' : 'Paused'}</div>
      </div>

      {/* Tooltip */}
      {(hoveredNode || hoveredEdge) && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-sm z-20 max-w-xs">
          {hoveredNode && (
            <>
              <div className="text-white font-medium mb-1">{hoveredNode}</div>
              <div className="text-gray-400 text-xs">
                Type: {hoveredNode.split(':')[0]} |
                Connections: {nodes.get(hoveredNode)?.connections || 0}
              </div>
            </>
          )}
          {hoveredEdge && (
            <>
              <div className="text-white font-medium mb-1">
                <span className="text-blue-400">{hoveredEdge.source.split(':').pop()}</span>
                <span className="text-purple-400 mx-2">{hoveredEdge.label.replace(/_/g, ' ')}</span>
                <span className="text-green-400">{hoveredEdge.target.split(':').pop()}</span>
              </div>
              <div className="text-gray-500 text-xs">
                {hoveredEdge.source} → {hoveredEdge.target}
              </div>
            </>
          )}
        </div>
      )}

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleBackgroundMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Glow filters for nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for edges */}
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>

          {/* Animated particle gradient */}
          <radialGradient id="particleGlow">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width={width} height={height} fill="transparent" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid pattern for depth */}
          <g opacity="0.1">
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * 40}
                x2={width}
                y2={i * 40}
                stroke="#fff"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 25 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 40}
                y1={0}
                x2={i * 40}
                y2={height}
                stroke="#fff"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {/* Edges with animated particles */}
          {edges.slice(0, 200).map((edge, i) => {
            const sourceNode = nodes.get(edge.source)
            const targetNode = nodes.get(edge.target)
            if (!sourceNode || !targetNode) return null

            const isHovered = hoveredEdge === edge
            const edgeColor = getEdgeColor(edge.label)

            return (
              <g key={`edge-${i}`}>
                {/* Edge line */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edgeColor}
                  strokeWidth={isHovered ? 3 : 1.5}
                  strokeOpacity={isHovered ? 0.9 : 0.4}
                  className="transition-all duration-200"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />

                {/* Animated particles flowing along edge */}
                {isSimulating && edge.particles.map((particle, pi) => {
                  const x = sourceNode.x + (targetNode.x - sourceNode.x) * particle.progress
                  const y = sourceNode.y + (targetNode.y - sourceNode.y) * particle.progress

                  return (
                    <circle
                      key={`particle-${i}-${pi}`}
                      cx={x}
                      cy={y}
                      r={particle.size}
                      fill={edgeColor}
                      opacity={0.8}
                      filter="url(#glow)"
                    />
                  )
                })}

                {/* Edge label on hover */}
                {isHovered && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2 - 8}
                    fontSize="11"
                    fill="#fff"
                    textAnchor="middle"
                    className="pointer-events-none"
                    style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
                  >
                    {edge.label.replace(/_/g, ' ')}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodeArray.slice(0, 100).map((node) => {
            const isHovered = hoveredNode === node.id
            const isDragged = draggedNode === node.id
            const baseRadius = 8 + Math.min(node.connections * 2, 16)
            const radius = isHovered || isDragged ? baseRadius + 6 : baseRadius
            const nodeColor = getNodeColor(node.id)

            return (
              <g key={node.id}>
                {/* Outer glow ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 8}
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth="2"
                  strokeOpacity={isHovered ? 0.5 : 0.2}
                  className="animate-ping"
                  style={{ animationDuration: '2s' }}
                />

                {/* Node background glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 4}
                  fill={nodeColor}
                  opacity={0.2}
                  filter="url(#glow)"
                />

                {/* Main node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={nodeColor}
                  stroke={isHovered || isDragged ? '#fff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isHovered || isDragged ? 3 : 2}
                  filter="url(#glow)"
                  className="transition-all duration-150 cursor-pointer"
                  style={{ cursor: isDragged ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + radius + 14}
                  fontSize="10"
                  fill="#fff"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{
                    textShadow: '0 0 4px rgba(0,0,0,0.9)',
                    opacity: isHovered ? 1 : 0.7
                  }}
                >
                  {node.id.split(':').pop()?.slice(0, 18) || node.id.slice(0, 18)}
                </text>

                {/* Connection count badge */}
                {node.connections > 1 && (
                  <g>
                    <circle
                      cx={node.x + radius * 0.7}
                      cy={node.y - radius * 0.7}
                      r={8}
                      fill="#1f2937"
                      stroke={nodeColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x={node.x + radius * 0.7}
                      y={node.y - radius * 0.7 + 3}
                      fontSize="8"
                      fill="#fff"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {node.connections}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Node count warning */}
      {nodeArray.length > 100 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-500/20 text-amber-300 px-4 py-2 rounded-lg text-xs">
          Showing 100 of {nodeArray.length} nodes for performance
        </div>
      )}
    </div>
  )
}
