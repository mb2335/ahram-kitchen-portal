"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  date?: DateRange | undefined;
  onSelect?: (date: DateRange | undefined) => void;
  className?: string;
  mode?: "single" | "range";
  disabled?: boolean;
}

export function DatePickerWithRange({
  date,
  onSelect,
  className,
  mode = "range",
  disabled = false,
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              mode === "range" ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode={mode === "single" ? "single" : "range"}
            defaultMonth={date?.from}
            selected={mode === "single" ? date?.from : date}
            onSelect={(value) => {
              if (mode === "single" && value) {
                onSelect?.({ from: value as Date, to: value as Date });
              } else {
                onSelect?.(value as DateRange);
              }
            }}
            numberOfMonths={1}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}