"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "./store";

export function PageNavigation() {
  const currentPage = useEditorStore((state) => state.currentPage);
  const pageCount = useEditorStore((state) => state.pageCount);
  const setCurrentPage = useEditorStore((state) => state.setCurrentPage);
  const [draft, setDraft] = useState(String(currentPage + 1));

  useEffect(() => {
    setDraft(String(currentPage + 1));
  }, [currentPage]);

  const commit = () => {
    const value = Number.parseInt(draft, 10);
    if (Number.isFinite(value)) setCurrentPage(value - 1);
    else setDraft(String(currentPage + 1));
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={currentPage <= 0}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Previous page</TooltipContent>
      </Tooltip>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Page</span>
        <Input
          aria-label="Current page"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commit();
              event.currentTarget.blur();
            }
          }}
          className="h-8 w-11 px-1 text-center tabular-nums"
        />
        <span className="whitespace-nowrap tabular-nums">of {pageCount}</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Next page</TooltipContent>
      </Tooltip>
    </div>
  );
}
