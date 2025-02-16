import { csvRowSchema } from "@shared/schema";
import { z } from "zod";

export function parseCSV(csvContent: string): z.infer<typeof csvRowSchema>[] {
  // Split the CSV content into lines
  const lines = csvContent.trim().split('\n');
  
  // Get headers from the first line
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['username', 'email', 'address'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  // Parse data rows
  const parsedRows = lines.slice(1).map((line, index) => {
    const values = line.split(',').map(value => value.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });

    try {
      return csvRowSchema.parse(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Error in row ${index + 2}: ${error.errors[0].message}`);
      }
      throw error;
    }
  });

  return parsedRows;
}

// Generate a secure random password
export function generateSecurePassword(): string {
  const length = 12;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((x) => chars[x % chars.length])
    .join('');
}
