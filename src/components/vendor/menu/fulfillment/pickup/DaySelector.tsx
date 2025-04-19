
import React from "react";
import { Button } from "@/components/ui/button";

interface DaySelectorProps {
  selectedDay: number;
  onDayChange: (day: number) => void;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function DaySelector({ selectedDay, onDayChange }: DaySelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {dayNames.map((name, index) => (
        <Button
          key={index}
          type="button"
          variant={selectedDay === index ? "default" : "outline"}
          className="text-sm"
          onClick={() => onDayChange(index)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
}
