/* api 추상화 레이어
  separation of concerns: api 요청과 관련된 모든 로직이 이 파일에 모여있음.
  api 클라이언트 (요청을 보내는 도구)를 추상화하여
  baseURL, 헤더, 인증, 에러 처리 등 공통 설정이 한 곳에 모여있고, 매번 작성하는 번거로움을 없앰.
  실제 api 요청은 api.get() 처럼 간단하게 사용 
*/
import Axios, { InternalAxiosRequestConfig } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';

/*
Accept, withCredentials 같은 HTTP message 공통 설정을 인터셉터로 자동으로 넣어줌

HTTP 메세지 구조
Request Line: http method, url, baseURL, params (쿼리스트링)
Header: auth, withCredentials(쿠키 전송), 
Body: data, formSerializer,transformRequest, 
*/
function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  config.withCredentials = true;
  return config;
}
/* axios 커스텀 인스턴스 설정
 매번 전체 url을 쓰지 않아도 되도록 baseURL 설정.
 interceptor로 리퀘스트 전에 인증 토큰 붙이고, 리스폰스에서 에러 처리하는 로직 추가
*/
export const api = Axios.create({
  baseURL: env.API_URL,
});

/*
authRequestInterceptor는 콜백 패턴으로 함수 등록만 되어있다. (바로 호출하지 않음)
api 요청이 오면 자동으로 authRequestInterceptor가 실행되면서 config 객체를 받아서 헤더에 인증 토큰 붙이는 작업이 일어남
Axios가 config 객체 생성해서 콜백 함수로 넘겨줌. 풀어쓰면 아래와 같다.
api.interceptors.request.use((config) => authRequestInterceptor(config));
*/
api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  // 에러시 알림 시스템에 에러 메세지 띄우고, 401 Unauthorised 일 때만 로그인 화면으로 리다이렉트한다.
  (error) => {
    const message = error.response?.data?.message || error.message;
    useNotifications.getState().addNotification({
      type: 'error',
      title: 'Error',
      message,
    });

    if (error.response?.status === 401) {
      const searchParams = new URLSearchParams();
      const redirectTo =
        searchParams.get('redirectTo') || window.location.pathname;
      window.location.href = paths.auth.login.getHref(redirectTo);
    }

    return Promise.reject(error);
  },
);
