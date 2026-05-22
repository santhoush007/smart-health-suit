// Paste this code:
export const callGeminiAI = async (prompt) => {
  const apiKey = "YOUR_GEMINI_API_KEY_HERE"; // <--- PASTE YOUR REAL API KEY HERE

  const delays = [1000, 2000, 4000];

  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      if (i === 2) return "Smart Health AI is currently offline. Please check your internet.";
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};