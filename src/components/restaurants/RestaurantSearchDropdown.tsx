import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Restaurant } from '@/hooks/useRestaurants';

interface RestaurantSearchDropdownProps {
  restaurants: Restaurant[];
  value?: string;
  onSelect: (restaurant: Restaurant | null) => void;
  placeholder?: string;
  className?: string;
}

export function RestaurantSearchDropdown({
  restaurants,
  value,
  onSelect,
  placeholder = "Select a restaurant...",
  className,
}: RestaurantSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedRestaurant = restaurants.find(
    (restaurant) => restaurant.id === value
  );

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    restaurant.city.toLowerCase().includes(searchValue.toLowerCase()) ||
    restaurant.full_address.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedRestaurant ? (
            <span className="truncate">
              {selectedRestaurant.name} - {selectedRestaurant.city}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search restaurants..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>No restaurants found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="clear"
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="text-muted-foreground"
                >
                  Clear selection
                </CommandItem>
              )}
              {filteredRestaurants.map((restaurant) => (
                <CommandItem
                  key={restaurant.id}
                  value={restaurant.id}
                  onSelect={() => {
                    onSelect(restaurant);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === restaurant.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{restaurant.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {restaurant.city}, {restaurant.state_province}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}