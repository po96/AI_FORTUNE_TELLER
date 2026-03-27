
export default async function handler(req, res) {
    // 1. GET 요청인지 POST 요청인지 확인 (보통 데이터 전송은 POST 권장)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
	const userData = req.body; // index.html에서 보낸 데이터
    // GPT에게 보낼 정교한 프롬프트 구성
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
        // 2. OpenAI API 호출 (Vercel 환경변수 사용)
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // 중요: 환경변수 설정 필요
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "당신은 전문 명리학자입니다. 사용자의 질문에 1단계(시간검증), 2단계(일주확정), 3단계(분석) 순서로 답하세요." },
                    { role: "user", content: `이름: ${userData.name}, 생년월일: ${userData.birthdate}, 시간: ${userData.birthtime}, 구분: ${userData.calendar} 분석해줘.` }
                ],
                temperature: 0.7
            })
        });
const data = await response.json();
        const resultText = data.choices[0].message.content;

        // 3. 성공 응답 보냄
        res.status(200).json({ result: resultText });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
