import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Search, X } from 'lucide-react';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  filterOptions: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  dateFilters?: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  };
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
}

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  filterOptions,
  dateFilters,
  onClearAll,
  resultCount,
  totalCount
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'all').length +
    (dateFilters?.from ? 1 : 0) + (dateFilters?.to ? 1 : 0);

  return (
    <Card className="card-modern">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-semibold">Filters & Search</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              disabled={activeFiltersCount === 0 && !searchQuery}
            >
              Clear All
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong> results</span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Quick Filters */}
          <div className={`grid gap-4 ${isExpanded ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
            {filterOptions.slice(0, isExpanded ? filterOptions.length : 3).map((filterOption) => (
              <Select
                key={filterOption.key}
                value={filters[filterOption.key] || 'all'}
                onValueChange={(value) => onFilterChange(filterOption.key, value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={filterOption.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filterOption.label}</SelectItem>
                  {filterOption.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          {/* Date Filters */}
          {dateFilters && (
            <div className={`grid gap-4 ${isExpanded ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="From Date"
                  value={dateFilters.from}
                  onChange={(e) => dateFilters.onFromChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={dateFilters.to}
                  onChange={(e) => dateFilters.onToChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === 'all') return null;
                const filterOption = filterOptions.find(f => f.key === key);
                const option = filterOption?.options.find(o => o.value === value);
                return (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {filterOption?.label}: {option?.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => onFilterChange(key, 'all')}
                    />
                  </Badge>
                );
              })}
              {dateFilters?.from && (
                <Badge variant="secondary" className="gap-1">
                  From: {dateFilters.from}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => dateFilters.onFromChange('')}
                  />
                </Badge>
              )}
              {dateFilters?.to && (
                <Badge variant="secondary" className="gap-1">
                  To: {dateFilters.to}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => dateFilters.onToChange('')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
