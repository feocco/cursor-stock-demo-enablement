const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  label = '',
  error = '',
  disabled = false,
  min,
  max,
  step,
  className = ''
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full px-4 py-2 bg-surface-raised border ${
          error ? 'border-loss' : 'border-border'
        } rounded-xl text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 motion-reduce:transition-none ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-loss">{error}</p>
      )}
    </div>
  )
}

export default Input
