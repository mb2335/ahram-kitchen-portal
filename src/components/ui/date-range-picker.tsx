
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
  disabledDays?: (date: Date) => boolean;
}

export function DatePickerWithRange({
  date,
  onSelect,
  className,
  mode = "range",
  disabled = false,
  disabledDays,
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
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          {mode === "single" ? (
            <Calendar
              initialFocus
              mode="single"
              defaultMonth={date?.from}
              selected={date?.from}
              onSelect={(value) => {
                if (value) {
                  onSelect?.({ from: value, to: value });
                }
              }}
              numberOfMonths={1}
              className="p-3 pointer-events-auto"
              disabled={disabledDays}
            />
          ) : (
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onSelect}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
              disabled={disabledDays}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
