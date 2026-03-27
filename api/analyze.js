const OPENAI_API_KEY = `Bearer ${process.env.OPENAI_API_KEY}`; // 실제 서비스 시 환경변수로 관리 권장

export async function fetchSajuAnalysis(userData) {
    const { name, birthdate, birthtime, calendar, gender } = userData;

    // GPT에게 보낼 정교한 프롬프트 구성
    const prompt = `
    당신은 20년 경력의 전문 명리학자입니다. 아래 사용자의 정보를 바탕으로 단계별 사주 분석을 수행하세요.
    
    [사용자 정보]
    - 이름: ${name}
    - 생년월일: ${birthdate} (${calendar})
    - 태어난 시간: ${birthtime}
    - 성별: ${gender}

    [요청 사항]
    1단계 [시간 적용 확인]: 한국 표준시와 야자시(23:30~00:30) 기준을 적용하여 날짜 변경 여부를 논리적으로 설명하세요.
    2단계 [일주 확정]: 위 기준을 적용한 정확한 일주(日柱)의 한자와 한글명을 확정하세요.
    3단계 [기본 분석]: 확정된 일주를 바탕으로 사용자의 타고난 성격, 특징, 조언을 상세히 서술하세요.

    답변은 반드시 한국어로, 친절하고 전문적인 어조로 작성해 주세요.
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // 저렴하고 빠른 모델 사용
                messages: [
                    { role: "system", content: "당신은 심도 깊은 사주 분석 전문가입니다." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7 // 창의성과 정확성의 균형
            })
        });

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error("API 호출 오류:", error);
        return "죄송합니다. 운세를 불러오는 중에 오류가 발생했습니다.";
    }
}