// /src/styles/theme.js
export const theme = {
    colors: {
      primary: {
        50: '#e6f7ff',
        100: '#bae7ff',
        300: '#69c0ff',
        500: '#1890ff',  // 메인 컬러
        700: '#0050b3',
        900: '#002766',
      },
      secondary: {
        50: '#f0f5ff',
        100: '#d6e4ff', 
        300: '#85a5ff',
        500: '#4d73e5',  // 세컨더리 컬러
        700: '#314b9c',
        900: '#061178',
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        300: '#d1d5db',
        500: '#6b7280',
        700: '#374151',
        900: '#111827',
      },
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '6': '1.5rem',
      '8': '2rem',
      '12': '3rem',
      '16': '4rem',
    },
    
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'full': '9999px',
    },
    
    boxShadow: {
      'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  };
  
  export default theme;