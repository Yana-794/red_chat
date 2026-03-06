import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-gray-500" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-[#0a0e27]/60 border border-red-900/30 rounded-4xl text-white placeholder-gray-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600/50 transition-all duration-200"
      />
    </div>
  );
};

export default SearchInput;
