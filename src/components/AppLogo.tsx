import { Image, useColorScheme, type ImageStyle, type StyleProp } from 'react-native';

interface AppLogoProps {
  style?: StyleProp<ImageStyle>;
}

export function AppLogo({ style }: AppLogoProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Image
      source={isDark ? require('../../assets/logo-dark.jpg') : require('../../assets/logo-light.jpg')}
      style={style}
      accessibilityLabel="Logo de Trazzo"
    />
  );
}
