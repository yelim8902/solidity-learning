# Hardhat v2 Test Project

이 프로젝트는 Hardhat v2.22.19를 사용한 스마트 컨트랙트 개발 환경입니다.

## 프로젝트 구조

```
hardhat-test/
├── contracts/          # 스마트 컨트랙트 파일들
│   └── Greeter.sol
├── scripts/            # 배포 및 유틸리티 스크립트
│   └── deploy.js
├── test/               # 테스트 파일들
│   └── Greeter.test.js
├── hardhat.config.js   # Hardhat 설정 파일
└── package.json        # 프로젝트 의존성
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 컴파일

```bash
npm run compile
# 또는
npx hardhat compile
```

### 3. 테스트 실행

```bash
npm test
# 또는
npx hardhat test
```

### 4. 로컬 네트워크에서 배포

```bash
# 터미널 1: 로컬 네트워크 시작
npm run node
# 또는
npx hardhat node

# 터미널 2: 컨트랙트 배포
npm run deploy
# 또는
npx hardhat run scripts/deploy.js
```

## 사용 가능한 스크립트

- `npm run compile` - 스마트 컨트랙트 컴파일
- `npm test` - 테스트 실행
- `npm run deploy` - 컨트랙트 배포
- `npm run node` - 로컬 하드헷 네트워크 시작

## 주요 기능

- **Greeter 컨트랙트**: 간단한 인사말을 저장하고 변경할 수 있는 스마트 컨트랙트
- **Hardhat 네트워크**: 로컬 개발을 위한 이더리움 네트워크
- **테스트 환경**: Chai와 Waffle을 사용한 테스트 프레임워크

## 개발 가이드

1. `contracts/` 폴더에 새로운 스마트 컨트랙트를 작성하세요
2. `test/` 폴더에 해당 컨트랙트의 테스트를 작성하세요
3. `scripts/` 폴더에 배포 스크립트를 작성하세요
4. `npm test`로 테스트를 실행하세요
5. `npm run deploy`로 컨트랙트를 배포하세요

## 더 많은 정보

- [Hardhat 공식 문서](https://hardhat.org/docs)
- [Solidity 공식 문서](https://docs.soliditylang.org/)
