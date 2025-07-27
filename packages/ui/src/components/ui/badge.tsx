import { Text, View } from "react-native";
import clsx from "clsx";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "outline" | "neutral";
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const baseStyle =
    "px-2 py-1 rounded-full text-xs font-medium";

  const variants = {
    default: "bg-blue-100 text-blue-800",
    outline: "bg-transparent border border-blue-400 text-blue-600",
    neutral: "bg-gray-100 text-gray-800",
  };

  return (
    <View className={clsx(baseStyle, variants[variant], className)}>
      <Text className="text-xs font-medium">{children}</Text>
    </View>
  );
}
