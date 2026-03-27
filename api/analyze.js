export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // [체크 1] 환경변수 로드 확인
    const apiKey = process.env.OPENAI_API_KEY;
    
    // 디버깅용: 키가 존재하면 앞 5글자만 추출 (보안 유지)
    const keyStatus = apiKey 
        ? `존재함 (시작문자: ${apiKey.substring(0, 5)}...)` 
        : "찾을 수 없음 (undefined)";

    try {
        const userData = req.body;

        // [체크 2] 키가 없으면 상세 에러 반환
        if (!apiKey || apiKey.trim() === "") {
            return res.status(500).json({ 
                error: `서버 환경변수 로드 실패. 현재 상태: ${keyStatus}`,
                instruction: "Vercel Settings -> Environment Variables에서 OPENAI_API_KEY를 등록하고 반드시 'Redeploy' 하세요."
            });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}` // 공백 제거 추가
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "당신은 전문 명리학자입니다." },
                    { role: "user", content: `${userData.name}님의 사주를 분석해줘.` }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `OpenAI API 응답 에러: ${data.error?.message || '상세 사유 없음'}` 
            });
        }

        res.status(200).json({ result: data.choices[0].message.content });

    } catch (err) {
        res.status(500).json({ error: `서버 내부 오류: ${err.message}` });
    }
}