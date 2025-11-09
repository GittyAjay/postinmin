"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { DropletIcon, PaletteIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string | null;
  className?: string;
  triggerClassName?: string;
}

const palette = ["#2563eb", "#f97316", "#facc15", "#22d3ee", "#a855f7", "#14b8a6", "#f43f5e"];

const normalizeHex = (value?: string) => {
  if (!value) return "#2563eb";
  return value.startsWith("#") ? value : `#${value}`;
};

const isValidHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export const ColorPicker = ({
  value = "#2563eb",
  onChange,
  label = "Brand color",
  className,
  triggerClassName,
}: ColorPickerProps) => {
  const normalized = useMemo(() => value ?? "#2563eb", [value]);
  const [inputValue, setInputValue] = useState(() => normalizeHex(normalized));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const normalizedValue = normalizeHex(value);
    if (normalizedValue !== inputValue) {
      setInputValue(normalizedValue);
    }
  }, [value, inputValue]);

  const handleChange = useCallback(
    (color: string) => {
      const normalizedColor = normalizeHex(color).toLowerCase();
      setInputValue(normalizedColor);
      onChange(normalizedColor);
    },
    [onChange],
  );

  const handlePreset = useCallback(
    (color: string) => () => handleChange(color),
    [handleChange],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span> : null}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border-slate-200 bg-white px-3 text-left text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900",
              triggerClassName,
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200"
                style={{ backgroundColor: normalizeHex(normalized) }}
              >
                <PaletteIcon className="h-4 w-4 text-white drop-shadow" />
              </span>
              <span className="font-mono uppercase text-slate-700 dark:text-slate-300">{normalizeHex(normalized)}</span>
            </span>
            <DropletIcon className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-4">
          <HexColorPicker color={normalizeHex(normalized)} onChange={handleChange} />
          <div className="flex items-center gap-2">
            <input
              value={inputValue}
              onChange={(event) => setInputValue(normalizeHex(event.target.value).toLowerCase())}
              onBlur={() => {
                if (isValidHex(inputValue)) {
                  handleChange(inputValue);
                } else {
                  setInputValue(normalizeHex(value).toLowerCase());
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wide shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
            />
            <Button
              variant="outline"
              className="rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => handleChange(normalizeHex())}
              type="button"
            >
              Reset
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {palette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  handleChange(color);
                  setIsOpen(false);
                }}
                className={cn(
                  "h-8 w-8 rounded-full border border-slate-200 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:ring-offset-slate-900",
                  normalizeHex(normalized).toLowerCase() === color.toLowerCase() ? "ring-2 ring-blue-400" : "",
                )}
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

