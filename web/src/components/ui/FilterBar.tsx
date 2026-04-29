'use client';

import styles from './FilterBar.module.css';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterField[];
  onApply?: () => void;
}

export default function FilterBar({ filters, onApply }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      {filters.map((filter) => (
        <div key={filter.id} className={styles.field}>
          <label className={styles.label}>{filter.label}</label>
          <select
            className={styles.select}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {onApply && (
        <button className={styles.applyBtn} onClick={onApply}>
          Apply Filters
        </button>
      )}
    </div>
  );
}
