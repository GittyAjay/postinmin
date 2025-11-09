"use client";

import { useCallback, useMemo } from "react";
import { HexColorPicker } from "react-colorful";
import { PaletteIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
}

const palette = ["#2563eb", "#f97316", "#facc15", "#22d3ee", "#a855f7", "#14b8a6", "#f43f5e"];

export const ColorPicker = ({ value = "#2563eb", onChange, label = "Brand color" }: ColorPickerProps) => {
  const normalized = useMemo(() => value ?? "#2563eb", [value]);

  const handlePreset = useCallback(
    (color: string) => () => onChange(color),
    [onChange],
  );

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex w-full items-center justify-between rounded-xl border-slate-200 bg-white px-4 py-2 text-left text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200" style={{ backgroundColor: normalized }}>
                <PaletteIcon className="h-4 w-4 text-white drop-shadow" />
              </span>
              <span>{normalized}</span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-4">
          <HexColorPicker color={normalized} onChange={onChange} />
          <div className="flex flex-wrap gap-2">
            {palette.map((color) => (
              <button
                key={color}
                onClick={handlePreset(color)}
                className="h-8 w-8 rounded-full border border-slate-200"
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

