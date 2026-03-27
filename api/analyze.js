export default async function handler(req, res) {
    // 1. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 요청 방식입니다. (Method Not Allowed)' });
    }

    try {
        const userData = req.body;
		const prompt = `
		당신은 20년 경력의 전문 명리학자입니다. 아래 사용자의 정보를 바탕으로 단계별 사주 분석을 수행하세요.
		
		[사용자 정보]
		- 이름: ${userData.name}
		- 성별: ${userData.gender === 'male' ? '남성' : '여성'}
		- 생년월일: ${userData.birthdate} (${userData.calendar === 'solar' ? '양력' : '음력'})
		- 태어난 시간: ${userData.birthtime}

		[요청 사항]
		1단계 [시간 적용 확인]: 한국 표준시와 야자시(23:30~00:30) 기준을 적용하여 날짜 변경 여부를 논리적으로 설명하세요.
		2단계 [일주 확정]: 위 기준을 적용한 정확한 일주(日柱)의 한자와 한글명을 확정하세요.
		3단계 [기본 분석]: 확정된 일주를 바탕으로 사용자의 타고난 성격, 특징, 조언을 상세히 서술하세요.

		답변은 반드시 한국어로, 친절하고 전문적인 어조로 작성해 주세요.
		`;
        const apiKey: process.env.OPENAI_API_KEY;
		

        // 2. Vercel 환경변수 설정 확인
        if (!apiKey) {
            console.error("에러: OPENAI_API_KEY가 설정되지 않았습니다.");
            return res.status(500).json({ 
                error: "서버 설정 오류: Vercel 환경변수에 API Key가 등록되지 않았습니다. 대시보드를 확인해 주세요." 
            });
        }

        // 3. OpenAI API 호출
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: "당신은 전문 명리학자입니다. 사용자의 정보를 바탕으로 1단계(시간검증), 2단계(일주확정), 3단계(분석) 순으로 상세히 답하세요." 
                    },
                    { 
                        role: "user", 
                        content: `이름: ${userData.name}, 성별: ${userData.gender}, 생년월일: ${userData.birthdate}, 시간: ${userData.birthtime}, 구분: ${userData.calendar} 분석 시작해줘.` 
                    }
                ],
                temperature: 0.3 // 일관된 분석을 위해 낮은 수치 권장
            })
        });

        // 4. API 응답 상태 확인
        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI API 응답 에러:", data);
            return res.status(response.status).json({ 
                error: `OpenAI 에러: ${data.error?.message || '알 수 없는 오류가 발생했습니다.'}` 
            });
        }

        // 5. 데이터 구조 검증 및 결과 반환
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return res.status(200).json({ result: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: "응답 데이터 구조가 예상과 다릅니다. (Choices 미발견)" });
        }

    } catch (err) {
        // 6. 예기치 못한 서버 에러 처리
        console.error("서버 내부 에러:", err);
        return res.status(500).json({ error: `서버 내부 오류: ${err.message}` });
    }
}