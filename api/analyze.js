export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { image } = req.body; // Base64 데이터 (data:image/jpeg;base64,...)

  try {
    const apiKey = process.env.OPENAI_API_KEY; // Vercel Settings에서 설정하세요.
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const prompt = `당신은 패션 전문가입니다.
		다음 사진의 데일리룩 코디를 전문가적 관점에서 상세하게 설명해주세요.
        피드백과 개선을 위한것이기 때문에 점수는 높지않아도 괜찮아요.
		10~30 : 매칭이 잘 맞지 않는경우
		30~50 : 너무 단순한 경우
		50~70 : 무난한경우
		70~90 : 스타일이 멋진경우
		90~99 : 메이크업과 스타일이 멋진경우
		100 : 전부 완벽한 경우
		중요 지침:
		1. 헤어나 메이크업은 점수에 거의 반영하지 말고, 옷의 조화(색상, 핏, 스타일)에 집중하세요.
		2. 결과는 반드시 '점수:', '분석:', '강점:', '개선점:' 키워드를 포함하세요.
		3. 점수는 (0~100)/100 형식으로 작성하세요.
		4. 강점은 최소 4가지 이상, 번호를 매겨 각 항목마다
		   - 왜 강점인지
		   - 스타일링 측면에서 어떤 효과가 있는지
		   를 구체적으로 설명하세요.
		5. 개선점은 최소 3가지 이상, 번호를 매겨
		   - 현재 아쉬운 이유
		   - 실질적인 개선 대안(아이템, 컬러, 핏 등)
		   을 함께 제시하세요.
		6. 친절하지만 패션 전문가다운 전문적인 어조를 유지하세요.
	    7. 요약정보나 재 질문은 필요없어요.
		- totalScore: 0~100
		- clothing: 0~80
		- hair: 0~10
		- makeup: 0~10
		`;


    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // GPT-4o mini 모델 지정
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: image // 전달받은 Base64 이미지를 직접 입력
                }
              }
            ]
          }
        ],
        max_tokens: 600 // 분석 결과 길이를 제한하여 비용 절감
      })
    });

    const data = await response.json();
    
    // API 호출 에러 처리
    if (data.error) {
      throw new Error(data.error.message);
    }

    const resultText = data.choices[0].message.content;
    res.status(200).json({ analysis: resultText });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다: ' + error.message });
  }
}