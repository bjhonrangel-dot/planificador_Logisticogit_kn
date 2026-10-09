import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LabelGeneratorPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
        <Button asChild variant="outline" className="mb-4">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Planificador
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Generador de Etiquetas</CardTitle>
          <CardDescription>
            Esta funcionalidad está en desarrollo y estará disponible en una futura versión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Aquí podrá generar etiquetas personalizadas para su operación logística.</p>
        </CardContent>
      </Card>
    </div>
  );
}
