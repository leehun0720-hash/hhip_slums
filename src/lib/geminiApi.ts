/// <reference types="vite/client" />

/**
 * API 연동 및 예외 처리 (엄격한 API Key 검증 및 폴백 로직)
 */
export async function callGeminiApiWithFallback(prompt: string) {
  // 1. 엄격한 API Key 검증 (가짜 환경변수 방어)
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_API_KEY") {
    console.warn("🚨 유효하지 않은 API 키입니다. Fallback 키를 사용하거나 확인이 필요합니다.");
    // Fallback 로직 혹은 에러 처리
    // apiKey = "실제_대체_키_입력"; 
    throw { status: 403, message: "API key not valid or missing." };
  }

  // 2. 자동 모델 폴백(Fallback) 시스템 구현
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      // 실제 구현 시 백엔드 프록시 또는 공식 SDK를 사용하여 호출합니다.
      // 여기서는 REST API 호출 형태로 예시를 작성했습니다.
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[${model}] 모델 접근 오류(404), 다음 모델로 재시도합니다...`);
          lastError = { status: 404, message: `Model ${model} not found` };
          continue; // 404 에러일 경우에만 다음 하위 모델로 재시도
        }
        
        // 404 이외의 에러는 상위 계층으로 즉시 예외 전파
        const errorData = await response.json().catch(() => null);
        throw { 
          status: response.status, 
          message: errorData?.error?.message || "GenAI API request failed." 
        };
      }

      return await response.json();
    } catch (err: any) {
      if (err.status && err.status !== 404) throw err;
      lastError = err;
    }
  }

  // 모든 모델이 실패한 경우
  throw lastError || { status: 500, message: "All fallback models failed." };
}
