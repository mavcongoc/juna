interface JunaLogoProps {
  className?: string
  textClassName?: string
}

export default function JunaLogo({ className, textClassName }: JunaLogoProps) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <span className={`font-light text-gradient ${textClassName || ""}`}>Juna</span>
    </div>
  )
}
