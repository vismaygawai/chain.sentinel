export async function callLocalLLM(prompt: string): Promise<string> {
  const baseUrl = process.env.QWEN_API_URL || "https://ollama-qwen.zeabur.app";
  const endpoint = baseUrl.endsWith("/api/generate") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/api/generate`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5",
      prompt,
      stream: false
    })
  });

  const data = await res.json();
  return data.response;
}
