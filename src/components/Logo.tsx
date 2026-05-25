import logo from "@/assets/logo-servicexpress.jpg";

export function Logo({ className = "h-10" }: { className?: string }) {
  return <img src={logo} alt="ServicExpress" className={className} />;
}
