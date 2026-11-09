export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI is not connected yet. Add GROQ_API_KEY in Vercel Project Settings → Environment Variables." });
  }

  try {
    const body = req.body || {};
    const question = typeof body.message === "string" ? body.message.trim() : "";
    if (!question || question.length > 1200) {
      return res.status(400).json({ error: "Please send a question under 1,200 characters." });
    }

    const history = Array.isArray(body.history) ? body.history.slice(-8).map((item) => ({
      role: item && item.role === "assistant" ? "assistant" : "user",
      content: String(item && item.content || "").slice(0, 1200)
    })) : [];

    const system = `You are Gokul's friendly portfolio avatar. Reply primarily in natural spoken Tamil, with familiar English technical terms when useful. Keep answers concise, warm, and accurate. You represent Gokul, an Agricultural Engineering student at RVS Technical Campus, Coimbatore, who builds software, AI, AgriTech and 3D projects. His showcased projects include TN Bus Studio (Tamil Nadu bus 3D/simulation), FarmPlug AI (AgriTech), PyMind-A (Python language-model learning project), Autonomous R1 (miniature autonomous car project), Python Creative AI Studio, and Gokul 3D Lab. His skills listed on this portfolio include Python, JavaScript, TypeScript, HTML, CSS, React, Next.js, Three.js, Supabase, Blender, Godot, Unreal Engine, GitHub and Vercel. For contact or source details, direct visitors to the links on this portfolio/GitHub profile. Do not invent achievements, grades, contact details, project completion status, or personal facts. If asked something outside the portfolio, say politely that you can mainly explain Gokul's work and interests.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: question }],
        max_completion_tokens: 320,
        temperature: 0.6
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "The AI service could not answer right now." });
    }

    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    return res.status(200).json({ reply: answer });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong while contacting the AI service." });
  }
}
