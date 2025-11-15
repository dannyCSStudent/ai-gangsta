// import { View, Text } from 'react-native'
// import { cn } from '../../../utils/cn'

// export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <View className={cn('rounded-2xl border border-gray-200 bg-white dark:bg-black/40 shadow-sm', className)}>
//       {children}
//     </View>
//   )
// }

// export function CardHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <View className={cn('px-4 pt-4', className)}>
//       {children}
//     </View>
//   )
// }

// export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <View className="mb-1">
//       <Text className={cn('text-lg font-bold text-black dark:text-white', className)}>
//         {children}
//       </Text>
//     </View>
//   )
// }

// export function CardDescription({ className = '', children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <View>
//       <Text className={cn('text-sm text-gray-600 dark:text-gray-300', className)}>
//         {children}
//       </Text>
//     </View>
//   )
// }

// export function CardContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <View className={cn('px-4 py-2', className)}>
//       {children}
//     </View>
//   )
// }

// export function CardFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <View className={cn('px-4 pb-4 pt-2', className)}>
//       {children}
//     </View>
//   )
// }

import { cn } from "../../../utils/cn";

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white dark:bg-black/40 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-4 py-2", className)}>{children}</div>;
}
