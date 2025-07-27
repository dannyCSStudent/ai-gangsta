// packages/ui/utils/cn.ts
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(inputs.filter(Boolean).join(' '))
}
