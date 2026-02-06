// Test with gemini-2.0-flash
const API_KEY = "AIzaSyDz44taimhTKDHz6aZHNtY3INmzNJTTAHA";

async function testGeminiAPI() {
    console.log("Testing Gemini API with gemini-2.0-flash...\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Generate a 2-3 sentence daily briefing about technology trends for an alumni network. Include: 1) A cutting-edge tech trend, 2) A networking tip, 3) A career insight. Be specific and professional. No greetings."
                    }]
                }]
            })
        });

        const data = await response.json();
        console.log("=== API Response ===");

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const text = data.candidates[0].content.parts[0].text;
            console.log("Text:", text);
            console.log("\n✅ SUCCESS: API is working correctly!");
        } else if (data.error) {
            console.log("❌ Error:", data.error.message);
        } else {
            console.log("Full response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Fetch Error:", error);
    }
}

testGeminiAPI();
