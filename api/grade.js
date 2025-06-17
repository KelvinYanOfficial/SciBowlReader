export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { userAnswer, correctAnswer, isMultipleChoice = false } = req.body;

  // If it's a multiple-choice question, enforce strict equality
  if (isMultipleChoice) {
    const clean = str => str.trim().toLowerCase().replace(/\.$/, "");
    const u = clean(userAnswer);
    const c = clean(correctAnswer);

    const isStrictMatch = u === c;
    return res.status(200).json({ result: isStrictMatch ? "correct" : "incorrect" });
  }

  // OpenAI grading for short answer or freeform
  const prompt = `
You are a Science Bowl judge. A student answered: "${userAnswer}".
The correct answer is: "${correctAnswer}".

Is the student answer acceptable as a correct answer? Respond with only "correct" or "incorrect".
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5,
        temperature: 0
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.toLowerCase() || "incorrect";

    res.status(200).json({ result: content.includes("correct") ? "correct" : "incorrect" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI grading failed" });
  }
}
