export default async function handler(req, res) {
    // 1. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '허용되지 않은 요청 방식입니다. (Method Not Allowed)' });
    }

    try {
        const userData = req.body;
		const detailPrompt = `
		당신은 20년 경력의 전문 명리학자입니다. 아래 사용자의 정보를 바탕으로 단계별 사주 분석을 수행하세요.
		
		[사용자 정보]
		- 이름: ${userData.name}
		- 성별: ${userData.gender === 'male' ? '남성' : '여성'}
		- 생년월일: ${userData.birthdate} (${userData.calendar === 'solar' ? '양력' : '음력'})
		- 태어난 시간: ${userData.birthtime}

		[요청 사항]
		1단계 [시간 적용 확인]: 한국 표준시와 야자시(23:30~00:30) 기준을 적용하여 날짜 변경 여부를 논리적으로 설명하세요.
			 [일주 확정]: 위 기준을 적용한 정확한 일주(日柱)의 한자와 한글명을 확정하세요.
			 [기본 분석]: 확정된 일주를 바탕으로 사용자의 타고난 성격, 특징, 조언을 상세히 서술하세요.
		2단계 [기본 분석 요청]위 [1단계]에서 확정된 '일주(日柱)'를 기준으로, 다음 정보를 분석해 주세요.
			1) 사주팔자(四柱八字):    * 연주(年柱), 월주(月柱), 확정된 일주(日柱), 시주(時柱) 각각의 한자, 한글, 오행을 표기한 전체 사주팔자를 보여주세요.
			2) 일간(日干):    * 저를 상징하는 '일간'이 무엇인지 알려주세요.
			3) 오행(五行) 분석:    * 제 사주 원국(8글자)의 목(木), 화(火), 토(土), 금(金), 수(水) 분포를 알려주세요.    * 부족하거나 강한 오행이 무엇인지 간략히 설명해 주세요.
			4) 십신(十神) 분석:    * [1단계]에서 확정된 '일간'을 기준으로, 사주 원국의 십신(비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인) 구성을 알려주세요.
			5) 대운(大運):    * 저의 10년 주기 대운의 흐름(순행/역행 여부 포함)을 순서대로 알려주세요.
		3단계 [신년 운세 분석 요청]위에서 확인한 사주를 기준으로, [2026년 (병오년 丙午年)]의 신년 운세(세운)를 분석해 주세요.
			1)  [2026년의 기운 분석]:    * 2026년의 천간(丙)과 지지(午)는 제 일간(乙木) 기준으로 각각 어떤 십신(十神)에 해당하나요?    * 이 기운(예: '상관', '식신' 등)이 들어온다는 것은 어떤 의미인가요?
			2)  [사주 원국과의 상호작용]:    * 2026년의 기운(丙, 午)이 제 사주 원국과 만나 어떤 상호작용(형/충/파/해/합 등)을 하나요?    * 특히 제 사주에 강한 것과 부족한 것과는 어떤 관계가 있나요?
			3)  [주요 조언]:    * 이러한 기운의 상호작용을 바탕으로, 2026년에 제가 특별히 주목해야 할 긍정적인 기회는 무엇인가요?    * 반대로, 조심하거나 관리해야 할 부분(예: 건강, 대인관계, 직업)은 무엇인가요?

		답변은 반드시 한국어로, 친절하고 전문적인 어조로 작성해 주세요.
		`;
		const apiKey = process.env.OPENAI_API_KEY; // Vercel Settings에서 설정하세요.
		

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
                        content: detailPrompt // <--- 위에서 만든 상세 지침이 여기 들어갑니다.
                    },
                    { 
                        role: "user", 
                        content: `이름: ${userData.name}, 성별: ${userData.gender}, 생년월일: ${userData.birthdate}, 시간: ${userData.birthtime}, 구분: ${userData.calendar} 분석 시작해주세요.` 
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
