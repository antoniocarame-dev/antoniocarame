import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Descarga un Excel generado en el servidor. */
export function BotonExcel({ href, children = "Excel" }: { href: string; children?: React.ReactNode }) {
  return <Button asChild variant="outline" size="sm"><a href={href} download><FileSpreadsheet />{children}</a></Button>;
}
