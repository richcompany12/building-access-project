const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');

// 웹사이트의 모든 URL을 배열로 정의합니다.
const urls = [
 { url: '/', changefreq: 'daily', priority: 1 },  // Home page
  { url: '/register', changefreq: 'monthly', priority: 0.8 },
  { url: '/search', changefreq: 'weekly', priority: 0.7 },
  { url: '/notices', changefreq: 'weekly', priority: 0.6 },
  { url: '/suggestions', changefreq: 'weekly', priority: 0.6 },
  { url: '/login', changefreq: 'monthly', priority: 0.5 },
  { url: '/detail', changefreq: 'weekly', priority: 0.7 },  // 일반적인 상세 페이지. 동적 URL의 경우 아래 설명 참조
];

// 사이트맵 생성 함수
async function generateSitemap() {
  const stream = new SitemapStream({ hostname: 'https://building-access-project.web.app' });
  
  return streamToPromise(Readable.from(urls).pipe(stream)).then((data) =>
    data.toString()
  );
}

// 사이트맵 생성 및 파일로 저장
generateSitemap()
  .then((sitemap) => {
    createWriteStream('./public/sitemap.xml').write(sitemap);
    console.log('Sitemap generated successfully');
  })
  .catch((error) => console.log(error));