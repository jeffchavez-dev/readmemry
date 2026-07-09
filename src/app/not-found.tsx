import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="font-heading text-3xl italic text-primary">readmemry</h1>
      <p className="mt-4 text-lg font-medium">Page not found.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This link, profile, or page doesn&apos;t exist.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Back home
      </Link>
    </div>
  );
}
