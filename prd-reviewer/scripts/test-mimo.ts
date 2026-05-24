import Anthropic from "@anthropic-ai/sdk";

// Available MIMO models (discovered via /v1/models endpoint):
// mimo-v2-omni, mimo-v2-pro, mimo-v2.5, mimo-v2.5-pro
// Using mimo-v2.5-pro as the primary model

const MIMO_MODEL = "mimo-v2.5-pro";

const client = new Anthropic({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: "https://token-plan-cn.xiaomimimo.com/anthropic",
});

async function testBasicCall() {
  console.log("Testing MIMO API connection...");
  console.log(`Model: ${MIMO_MODEL}`);
  try {
    const response = await client.messages.create({
      model: MIMO_MODEL,
      max_tokens: 100,
      messages: [{ role: "user", content: "Say 'hello' in one word" }],
    });
    const text = response.content.find((b) => b.type === "text");
    if (text && text.type === "text") {
      console.log("✅ Basic call succeeded:", text.text);
    } else {
      console.log("✅ Basic call succeeded (response):", response.content);
    }
    return true;
  } catch (error: any) {
    console.error("❌ Basic call failed:", error.message);
    return false;
  }
}

async function testToolUse() {
  console.log("\nTesting Tool Use...");
  try {
    const response = await client.messages.create({
      model: MIMO_MODEL,
      max_tokens: 200,
      tools: [
        {
          name: "report_issue",
          description: "Report a PRD issue",
          input_schema: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["high", "medium", "low"] },
              description: { type: "string" },
            },
            required: ["severity", "description"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: 'This PRD says "improve user experience" without metrics. Report one issue.',
        },
      ],
    });

    // Check for native tool_use block
    const block = response.content.find((b) => b.type === "tool_use");
    if (block && block.type === "tool_use") {
      console.log("✅ Native Tool Use succeeded:", JSON.stringify(block.input, null, 2));
      return true;
    }

    // MIMO returns tool calls as text, not native tool_use blocks
    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text" && textBlock.text.includes("<tool_call>")) {
      console.log("⚠️ Tool Use returned as text (not native tool_use block):");
      console.log("   MIMO does not support native Anthropic tool_use protocol.");
      console.log("   Will use JSON-in-prompt fallback for structured output.");
      console.log("   Response preview:", textBlock.text.substring(0, 200) + "...");
      return false;
    }

    console.log("⚠️ Tool Use returned unexpected format:", response.content);
    return false;
  } catch (error: any) {
    console.error("❌ Tool Use failed:", error.message);
    return false;
  }
}

async function main() {
  const basicOk = await testBasicCall();
  if (!basicOk) {
    console.log("\n❌ Basic API call failed. Check your API key and network.");
    process.exit(1);
  }
  const toolOk = await testToolUse();
  if (!toolOk) {
    console.log("\n⚠️ Native Tool Use not supported. Will use JSON-in-prompt fallback.");
  }
  console.log("\n✅ API test complete. Ready to build!");
}

main();
