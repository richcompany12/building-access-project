건물 입출입 관리 앱 개발 프로젝트
프로젝트 개요
이 프로젝트는 건물 입출입을 관리하는 React 기반의 웹 애플리케이션입니다. Firebase를 백엔드로 사용하며, 사용자 인증, 실시간 데이터베이스, 스토리지 기능을 활용합니다.
주요 기능

건물 등록 및 관리
건물 검색
공지사항 및 제안사항 기능
팝업 공지 시스템
사용자 인증 (구글 로그인)

기술 스택

Frontend: React, Tailwind CSS
Backend: Firebase (Authentication, Realtime Database, Storage)
추가 라이브러리: react-router-dom, browser-image-compression

프로젝트 구조

building-access-project/
├── src/
│   ├── components/
│   ├── App.js
│   ├── Auth.js
│   ├── Home.js
│   ├── Register.js
│   ├── Search.js
│   ├── Detail.js
│   ├── Notices.js
│   ├── Suggestions.js
│   ├── Login.js
│   ├── SideMenu.js
│   ├── firebase.js
│   └── index.js
├── public/
├── firebase.json
├── storage.rules
├── .env
├── package.json
└── tailwind.config.js

주요 컴포넌트 설명
App.js

앱의 메인 컴포넌트
라우팅 및 전체 레이아웃 관리
팝업 시스템 구현

Auth.js

Firebase Authentication 관리
사용자 로그인 상태 관리

Home.js

홈 화면 구현
최근 등록된 건물 목록 표시

Register.js

새로운 건물 등록 기능
이미지 업로드 및 압축 기능

Search.js

건물 검색 기능 구현

Detail.js

개별 건물 상세 정보 표시 및 수정

Notices.js 및 Suggestions.js

공지사항 및 제안사항 관리

현재 진행 상황
완료된 작업

기본 CRUD 기능 구현
사용자 인증 시스템 구현
팝업 시스템 구현
반응형 디자인 적용

진행 중인 작업

구글 로그인 문제 해결

현재 상태: 구글 계정으로 로그인 시 "정책을 준수하지 않음" 오류 발생
시도한 해결책:
a) Firebase 콘솔에서 승인된 도메인 추가
b) 프로젝트 공개용 이름 및 지원 이메일 확인
다음 단계:
a) Firebase 프로젝트 설정 재확인
b) OAuth 동의 화면 설정 검토
c) 구글 클라우드 콘솔에서 API 및 서비스 사용 설정 확인


로그인 없이 앱 사용 가능하도록 수정

Auth.js 및 App.js에서 인증 로직 수정 필요
PrivateRoute 컴포넌트 제거 및 라우팅 로직 수정



향후 작업

이미지 업로드 시 자동 리사이징 구현
관리자 전용 기능 강화
성능 최적화
보안 강화

설치 및 실행 방법

저장소 클론:
git clone [저장소 URL]
의존성 설치:
npm install
환경 변수 설정:
.env 파일을 생성하고 Firebase 설정 정보 추가
개발 서버 실행:
npm install
빌드 및 배포:
npm run build
firebase deploy

문제 해결 가이드

구글 로그인 문제:

Firebase 콘솔에서 Authentication > Sign-in method에서 구글 로그인 설정 확인
승인된 도메인 목록에 앱 도메인 추가 (localhost 포함)
Firebase 프로젝트 설정에서 웹 앱 추가 및 설정 확인


이미지 업로드 문제:

Storage 규칙 확인 및 수정
firebase.json 파일에서 Storage 설정 확인


데이터베이스 접근 문제:

Realtime Database 규칙 확인 및 수정
보안 규칙 테스트 수행



참고 사항

이 프로젝트는 개발 중이며, 일부 기능이 완전히 구현되지 않았을 수 있습니다.
보안 및 성능 최적화는 지속적으로 진행 중입니다.
문제 발생 시 이슈를 생성하거나 프로젝트 관리자에게 연락 바랍니다.

0809 pm09:14

