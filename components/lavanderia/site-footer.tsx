import Link from "next/link";
import { DuckIcon } from "@/components/ui/duck-icon";
import { Instagram } from "lucide-react";

export function SiteFooter({ showEmployeeLink = false }: { showEmployeeLink?: boolean }) {
  return (
    <footer className="border-t bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DuckIcon className="h-5 w-5 text-gray-900" />
              <span className="font-semibold text-gray-900">Lavô</span>
            </div>
            {showEmployeeLink && (
              <Link href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">
                Acesso funcionários
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} Lavô</p>
            <a
              href="https://www.instagram.com/likka.blu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
