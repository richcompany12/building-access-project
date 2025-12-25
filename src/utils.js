export const getInitialConsonants = (str) => {
  const initialConsonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  return str.replace(/\s/g, '').split('').map(char => {
    const code = char.charCodeAt(0) - 44032;
    if (code > -1 && code < 11172) return initialConsonants[Math.floor(code / 588)];
    return char;
  }).join('');
};

export const extractConsecutiveNumbers = (str) => {
  return str.replace(/[^0-9]/g, '');
};