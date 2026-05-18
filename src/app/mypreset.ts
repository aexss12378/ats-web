import Lara from '@primeng/themes/lara';
// src/app/themes/mypreset.ts
import { definePreset } from '@primeng/themes';

const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{blue.500}',
          inverseColor: '#ffffff',
          hoverColor: '{blue.600}',
          activeColor: '{blue.700}'
        },
        highlight: {
          background: '{blue.500}',
          focusBackground: '{blue.500}',
          color: '{blue.50}',
          focusColor: '#ffffff'
        }
      },
      dark: {
        primary: {
          color: '{blue.50}',
          inverseColor: '{blue.950}',
          hoverColor: '{blue.100}',
          activeColor: '{blue.50}'
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        }
      }
    }
  }
});

export default MyPreset;
