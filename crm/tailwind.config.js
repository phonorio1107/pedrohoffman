/** Visual "Pedro Hoffman Degrau". Marinho só no botão principal: um por tela. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tinta: '#0E0E10',
        papel: '#FFFFFF',
        fundo: '#F6F6F7',
        grafite: '#3A3A40',
        cinza: '#5A5A62',
        nevoa: '#E6E6E8',
        marinho: { DEFAULT: '#0B1F3A', claro: '#E7EDF6' },
        sucesso: { DEFAULT: '#1F6B43', fundo: '#E8F3EC' },
        atencao: { DEFAULT: '#8A4B00', fundo: '#FCF1E1' },
        erro: { DEFAULT: '#A3261B', fundo: '#FBE9E7' },
      },
      fontFamily: {
        titulo: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { campo: '10px', cartao: '16px' },
    },
  },
  plugins: [],
};
