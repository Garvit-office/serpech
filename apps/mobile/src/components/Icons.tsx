import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/** Line icons drawn to match the website (1.4 stroke, round joins). */
type P = { color?: ColorValue; size?: number; filled?: boolean };
const base = (size: number, color: ColorValue) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const, stroke: color, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export const HomeIcon = ({ color = "#0E1A15", size = 24 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M3 11l9-7 9 7" />
    <Path d="M5 10v10h14V10" />
    <Path d="M10 20v-6h4v6" />
  </Svg>
);
export const ShopIcon = ({ color = "#0E1A15", size = 24 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
  </Svg>
);
export const StudioIcon = ({ color = "#0E1A15", size = 24 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M8 3l-4 3 2 4 2-1v12h8V9l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z" />
    <Path d="M12 9v.01M12 12v.01M12 15v.01" />
  </Svg>
);
export const BagIcon = ({ color = "#0E1A15", size = 24 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M5 8h14l-1 12H6L5 8z" />
    <Path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);
export const UserIcon = ({ color = "#0E1A15", size = 24 }: P) => (
  <Svg {...base(size, color)}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Svg>
);
export const HeartIcon = ({ color = "#0E1A15", size = 22, filled }: P) => (
  <Svg {...base(size, color)} fill={filled ? color : "none"}>
    <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);
export const SearchIcon = ({ color = "#0E1A15", size = 22 }: P) => (
  <Svg {...base(size, color)}>
    <Circle cx="11" cy="11" r="6.5" />
    <Path d="M16 16l4 4" />
  </Svg>
);
export const BackIcon = ({ color = "#0E1A15", size = 24 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const CloseIcon = ({ color = "#0E1A15", size = 22 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const CheckIcon = ({ color = "#1F5B45", size = 20 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
export const RulerIcon = ({ color = "#0E1A15", size = 22 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M3 15L15 3l6 6L9 21z" />
    <Path d="M7 11l2 2M10 8l2 2M13 5l2 2" />
  </Svg>
);
export const CameraIcon = ({ color = "#0E1A15", size = 22 }: P) => (
  <Svg {...base(size, color)}>
    <Path d="M3 8h3.5L8 5.5h8L17.5 8H21v11H3z" />
    <Circle cx="12" cy="13" r="3.6" />
  </Svg>
);
