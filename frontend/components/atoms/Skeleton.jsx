const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'bg-gray-700 dark:bg-gray-700 light:bg-gray-200 animate-pulse rounded'
  
  const variants = {
    default: 'h-4',
    text: 'h-4',
    card: 'h-32',
    row: 'h-12',
    circle: 'rounded-full',
  }
  
  const variantClass = variants[variant] || variants.default
  
  return <div className={`${baseClasses} ${variantClass} ${className}`} />
}

export default Skeleton
