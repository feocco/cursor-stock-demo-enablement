const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  type = 'button',
  className = ''
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transition-none'
  
  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white shadow-sm',
    secondary: 'bg-surface-raised hover:bg-border/30 text-text border border-border',
    success: 'bg-gain hover:bg-gain/90 text-white shadow-sm',
    danger: 'bg-loss hover:bg-loss/90 text-white shadow-sm',
    ghost: 'hover:bg-surface-raised text-text-muted hover:text-text border border-transparent',
    outline: 'border border-border hover:bg-surface-raised text-text',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
