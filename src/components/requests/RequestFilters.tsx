import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, SortAsc, SortDesc, Filter as FilterIcon } from 'lucide-react';

export interface FilterState {
  search: string;
  status: string;
  sortBy: 'data_vencimento' | 'valor_total' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

interface RequestFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  statusOptions: { value: string; label: string }[];
  totalCount: number;
  filteredCount: number;
}

export function RequestFilters({ 
  filters, 
  onFiltersChange, 
  statusOptions,
  totalCount,
  filteredCount 
}: RequestFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      sortBy: 'data_vencimento',
      sortOrder: 'asc',
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all';

  return (
    <div className="space-y-4">
      {/* Quick Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por NF, fornecedor ou solicitante..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ordenar por
            </label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilter('sortBy', value as FilterState['sortBy'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_vencimento">Data de Vencimento</SelectItem>
                <SelectItem value="valor_total">Valor</SelectItem>
                <SelectItem value="created_at">Data de Criação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              title={filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            >
              {filters.sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{filteredCount}</Badge>
        <span>
          {filteredCount === totalCount 
            ? `solicitações encontradas` 
            : `de ${totalCount} solicitações`}
        </span>
      </div>
    </div>
  );
}
