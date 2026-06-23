"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Filter, X } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  onApply: (filters: Record<string, string>) => void;
  onClear: () => void;
}

export default function AdvancedFilters({ filters, onApply, onClear }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleApply = () => {
    onApply(filterValues);
    setOpen(false);
  };

  const handleClear = () => {
    setFilterValues({});
    onClear();
    setOpen(false);
  };

  const activeFilterCount = Object.values(filterValues).filter(v => v).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter size={16} className="mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {filters.map((filter) => (
            <div key={filter.key}>
              <Label htmlFor={filter.key}>{filter.label}</Label>
              {filter.type === 'text' && (
                <Input
                  id={filter.key}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => setFilterValues({ ...filterValues, [filter.key]: e.target.value })}
                  placeholder={`Search by ${filter.label.toLowerCase()}...`}
                />
              )}
              {filter.type === 'select' && (
                <Select
                  value={filterValues[filter.key] || ''}
                  onValueChange={(value) => setFilterValues({ ...filterValues, [filter.key]: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {filter.type === 'date' && (
                <Input
                  id={filter.key}
                  type="date"
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => setFilterValues({ ...filterValues, [filter.key]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClear}>
              <X size={16} className="mr-2" />
              Clear All
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
