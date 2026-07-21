import React, { useState } from 'react';
import { Search, Send, Loader2 } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBox({ onSearch, isLoading }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative flex items-center w-full max-w-4xl mx-auto"
    >
      <div className="absolute left-6 text-muted-foreground">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Search className="w-6 h-6" />
        )}
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
        placeholder="Nhập nhu cầu của bạn (VD: Tìm xe V12 đi dạo phố giá dưới 1 tỷ...)"
        className="w-full py-5 pl-16 pr-16 text-lg bg-card border-2 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-lg placeholder:text-muted-foreground/60 disabled:opacity-70"
      />
      
      <button
        type="submit"
        disabled={!query.trim() || isLoading}
        className="absolute right-3 p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50 transition-all"
      >
        <Send className="w-5 h-5 ml-0.5" />
      </button>
    </form>
  );
}
