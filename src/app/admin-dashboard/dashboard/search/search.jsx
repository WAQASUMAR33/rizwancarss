"use client";

import { MdSearch } from "react-icons/md";
import styles from "./search.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const Search = ({ placeholder }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSearch = useDebouncedCallback((e) => {
    const searchValue = e.target.value;
    const params = new URLSearchParams(searchParams);

    params.set("page", 1); // Reset to the first page when searching

    if (searchValue && searchValue.length > 2) {
      params.set("q", searchValue); // Set query parameter for search
    } else {
      params.delete("q"); // Remove the query if input is empty
    }

    // Use 'push' instead of 'replace' so the search state remains in the history
    router.push(`?${params.toString()}`);
  }, 300); // Debounce search input for smoother UX

  return (
    <div className={styles.container}>
      <MdSearch />
      <input
        type="text"
        placeholder={placeholder}
        className={styles.input}
        onChange={handleSearch}
      />
    </div>
  );
};

export default Search;
