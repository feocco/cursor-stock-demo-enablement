const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  onClick,
  hover = false
}) => {
  const variants = {
    default: 'bg-surface border border-border',
    raised: 'bg-surface-raised border border-border',
    flat: 'bg-surface',
  }
  
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  }
  
  const hoverClass = hover ? 'transition-all duration-150 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5' : ''
  const clickableClass = onClick ? 'cursor-pointer' : ''
  
  return (
    <div 
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card
