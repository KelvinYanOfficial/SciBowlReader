export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { userAnswer, correctAnswer, isMultipleChoice = false } = req.body;

  let prompt = "";

  if (isMultipleChoice) {
    prompt = `
You are a Science Bowl grader.

This is a MULTIPLE CHOICE question.

The student's answer was: "${userAnswer}"
The correct answer is: "${correctAnswer}"

Mark the answer "correct" only if:
- The student's letter (e.g., "B") matches the correct letter
- OR the student's full answer text matches the correct answer meaning
- Do not accept vague answers like just "the second one" or "the last choice"
- Capitalization, punctuation, or spacing does not matter

Otherwise, return "incorrect".

Output exactly "correct" or "incorrect" — no punctuation.
    `.trim();
  } else {
    prompt = `
You are a Science Bowl grader.

This is a SHORT ANSWER question.

The student's answer was: "${userAnswer}"
The correct answer is: "${correctAnswer}"

Mark the answer "correct" only if:
- The student clearly provides the same meaning and essential keywords
- The answer is specific and accurate
- Do not accept vague, incomplete, or overly broad answers

Otherwise, return "incorrect".

Output exactly "correct" or "incorrect" — no punctuation.
    `.trim();
  }

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
