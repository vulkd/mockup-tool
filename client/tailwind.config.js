const { colors } = require('tailwindcss/defaultTheme');

module.exports = {
  purge: false,
  theme: {
    extend: {
      colors: {
        brand: colors.gray
            // brand: {
          // 100: '#f7fafc',
          // 200: '#edf2f7',
          // 300: '#e2e8f0',
          // 400: '#cbd5e0',
          // 500: '#a0aec0',
          // 600: '#718096',
          // 700: '#4a5568',
          // 800: '#2d3748',
          // 900: '#1a202c'
          // '100': '#f5f5f5',
          // '200': '#eeeeee',
          // '300': '#e0e0e0',
          // '400': '#bdbdbd',
          // '500': '#9e9e9e',
          // '600': '#757575',
          // '700': '#616161',
          // '800': '#424242',
          // '900': '#212121',
            // }
      },
      lineHeight: {
        'sm': '18px'
      },
      cursor: {
        'grab': 'grab',
      },
      fontSize: {
        'xxxs': '.6rem',
        'xxs': '.7rem'
      },
      width: {
        '72': '18rem',
        '80': '20rem',
        '88': '22rem',
        '96': '24rem',
        '128': '32rem'
      },
      maxWidth: {
        '7xl': '84rem',
        '8xl': '90rem',
        '9xl': '102rem'
      },
      height: {
        '96': '24rem',
        '128': '32rem',
        '256': '64rem'
      }
    }
  },
  variants: {
    backgroundColor: ['dark', 'dark-hover', 'dark-group-hover'],
    borderColor: ['dark', 'dark-focus', 'dark-focus-within'],
    textColor: ['dark', 'dark-hover', 'dark-active']
  },
  plugins: [
    require('tailwindcss-dark-mode')(),
    require('@tailwindcss/custom-forms')
  ]
}

