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
  date: DateRange;
  onSelect: (date: DateRange | undefined) => void;
  className?: string;
  disabled?: boolean;
  mode?: 'single' | 'range';
}

export function DatePickerWithRange({
  date,
  onSelect,
  className,
  disabled = false,
  mode = 'range'
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date {mode === 'range' ? 'range' : ''}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {mode === 'single' ? (
            <Calendar
              initialFocus
              mode="single"
              defaultMonth={date?.from}
              selected={date?.from}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  onSelect({ from: selectedDate, to: selectedDate });
                }
              }}
              numberOfMonths={1}
            />
          ) : (
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onSelect}
              numberOfMonths={2}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}