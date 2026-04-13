import { storeConfig } from "@/config/store";

export default function Footer() {
  return (
    <footer className="bg-amber-900 text-amber-100 text-sm mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold text-base">
          <span>🍪</span>
          <span>{storeConfig.name}</span>
        </div>
        <p className="text-amber-300 text-xs text-center">
          {storeConfig.tagline}
        </p>
        <p className="text-amber-400 text-xs">
          © {new Date().getFullYear()} {storeConfig.name}
        </p>
      </div>
    </footer>
  );
}
