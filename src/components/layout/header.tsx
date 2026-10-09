
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Cog } from "lucide-react";
import Image from "next/image";
import { ReportButtons } from "../report-buttons";
import type { Warehouse } from "@/lib/types";
import { ReportButtonsProps } from "../report-buttons";


interface AppHeaderProps {
  warehouseName?: string;
  onOpenSettings: () => void;
  activeWarehouse: Warehouse | null;
}

export function AppHeader({ warehouseName, onOpenSettings, activeWarehouse }: AppHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const [exportData, setExportData] = React.useState<ReportButtonsProps | null>(null);

  React.useEffect(() => {
    const handleDataUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<ReportButtonsProps>;
        setExportData(customEvent.detail);
    };

    window.addEventListener('updateExportData', handleDataUpdate);
    return () => {
        window.removeEventListener('updateExportData', handleDataUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-primary text-primary-foreground px-4 backdrop-blur-sm md:px-6">
      <button onClick={toggleSidebar} className="flex items-center gap-2 cursor-pointer">
        <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-8" />
        <h1 className="text-lg font-semibold">Planificador Logistico</h1>
      </button>
      {warehouseName && (
        <>
            <Separator orientation="vertical" className="h-6 mx-2 bg-primary-foreground/50" />
            <span className="font-medium text-primary-foreground/80">{warehouseName}</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        {activeWarehouse && exportData && <ReportButtons {...exportData} />}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onOpenSettings} 
          className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground border-primary-foreground/30"
          disabled={!activeWarehouse}
        >
          <Cog className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </div>
    </header>
  );
}
