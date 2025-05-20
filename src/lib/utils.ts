
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency with commas for thousands
 * @param amount The amount to format
 * @param showCents Whether to show cents (default: false)
 * @returns Formatted currency string without $ sign
 */
export function formatCurrency(amount: number, showCents = false): string {
  // For amounts less than 1000, no commas needed
  if (Math.abs(amount) < 1000) {
    return showCents ? amount.toFixed(2) : Math.round(amount).toString();
  }
  
  // For larger amounts, add commas
  const roundedAmount = showCents ? amount.toFixed(2) : Math.round(amount).toString();
  
  // Split by decimal point if it exists
  const parts = roundedAmount.toString().split('.');
  const wholePart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  
  // Add commas to the whole part
  const wholeWithCommas = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return wholeWithCommas + decimalPart;
}
