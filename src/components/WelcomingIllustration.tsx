import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../theme/theme';

interface WelcomingIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

export const WelcomingIllustration: React.FC<WelcomingIllustrationProps> = ({
  width = 200,
  height = 200,
  color = theme.colors.primary.DEFAULT,
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 1000 1000">
      <Path
        d="M499.7 166.5c-184.9 0-334.7 149.8-334.7 334.7S314.8 835.9 499.7 835.9s334.7-149.8 334.7-334.7S684.6 166.5 499.7 166.5zm0 639.4c-167.7 0-304.7-137-304.7-304.7s137-304.7 304.7-304.7 304.7 137 304.7 304.7-137 304.7-304.7 304.7z"
        fill={color}
      />
      <Circle cx="499.7" cy="501.2" r="45.7" fill={color} />
      <Path
        d="M499.7 589.9c-88.6 0-160.7 72.1-160.7 160.7h30c0-72.1 58.6-130.7 130.7-130.7s130.7 58.6 130.7 130.7h30c0-88.6-72.1-160.7-160.7-160.7z"
        fill={color}
      />
    </Svg>
  );
}; 