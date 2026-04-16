import AuthButton from "./AuthButton";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-black text-blue-700 tracking-tight"
        >
          Chain<span className="text-slate-800">Tracing</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Trace
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}