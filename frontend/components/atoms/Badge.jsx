import { TrendingUp, TrendingDown } from 'lucide-react'

const Badge = ({ 
  children, 
  variant = 'default',
  showArrow = false,
  size = 'md',
  className = '' 
}) => {
  const variants = {
    default: 'bg-surface-raised text-text border border-border',
    gain: 'bg-gain/10 text-gain border border-gain/20',
    loss: 'bg-loss/10 text-loss border border-loss/20',
    accent: 'bg-accent/10 text-accent border border-accent/20',
    muted: 'bg-surface text-text-muted border border-border',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }
  
  const Arrow = variant === 'gain' ? TrendingUp : TrendingDown
  const showArrowIcon = showArrow && (variant === 'gain' || variant === 'loss')
  
  return (
    <span 
      className={`inline-flex items-center gap-1 font-medium rounded-md tabular-nums ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {showArrowIcon && <Arrow className="w-3 h-3" />}
      {children}
    </span>
  )
}

export default Badge
