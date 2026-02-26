export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Sora"', 'sans-serif'],
                body: ['"Manrope"', 'sans-serif']
            },
            colors: {
                ink: '#0d1117',
                slate: '#3a4a5e',
                mist: '#f2f5f7',
                sky: '#54a8ff',
                sand: '#f7efe5',
                lime: '#89f2b0',
                ember: '#ff7a59'
            },
            boxShadow: {
                soft: '0 10px 40px rgba(13, 17, 23, 0.12)'
            }
        }
    },
    plugins: []
}
