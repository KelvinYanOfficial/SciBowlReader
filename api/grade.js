export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { userAnswer, correctAnswer, isMultipleChoice = false } = req.body;

  if (isMultipleChoice) {
    const normalize = s => s.trim().toLowerCase().replace(/\.$/, "");

    const userNorm = normalize(userAnswer);
    const correctNorm = normalize(correctAnswer);

    const correctLetter = correctNorm[0];
    const correctText = correctNorm.replace(/^[a-dw-z]\)\s*/, "");

    const userLetter = userNorm[0];
    const userText = userNorm.replace(/^[a-dw-z]\)\s*/, "");

    const isCorrect =
      userNorm === correctNorm ||       // Full answer match
      userText === correctText ||       // Just the text matches
      userLetter === correctLetter;     // Just the letter matches

    return res.status(200).json({
      result: isCorrect ? "correct" : "incorrect"
    });
  }

  // Short Answer: AI grading
  const prompt = `
You are an official Science Bowl answer grader. The student answered: "${userAnswer}".
The correct answer is: "${correctAnswer}".

Respond ONLY with "correct" if the student's answer matches the correct answer in meaning and contains all essential words.

If the student's answer is vague, incomplete, overly broad, or imprecise, respond "incorrect".

Output exactly "correct" or "incorrect" – no punctuation.
  `.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1,
        temperature: 0
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    const grade = content === "correct" ? "correct" : "incorrect";

    return res.status(200).json({ result: grade });
  } catch (err) {
    console.error("AI grading error:", err);
    return res.status(500).json({ error: "Grading failed" });
  }
}
